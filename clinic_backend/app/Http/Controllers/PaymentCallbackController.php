<?php

namespace App\Http\Controllers;

use App\Contracts\BookingRepositoryInterface;
use App\Contracts\PaymentTransactionRepositoryInterface;
use App\Contracts\WalletRepositoryInterface;
use App\Contracts\WalletTransactionRepositoryInterface;
use App\Services\Api\V1\MyFatoorahService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentCallbackController extends Controller
{
    public function __construct(
        private readonly MyFatoorahService $myFatoorahService,
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly PaymentTransactionRepositoryInterface $paymentTransactionRepository,
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly WalletTransactionRepositoryInterface $walletTransactionRepository
    ) {}

    /**
     * Payment success callback
     */
    public function callback(Request $request)
    {
        try {
            // Try both paymentId and Id parameters (MyFatoorah might send either)
            $paymentId = $request->get('paymentId') ?? $request->get('Id');
            
            Log::info('Payment callback received', [
                'paymentId' => $paymentId,
                'all_params' => $request->all(),
                'url' => $request->fullUrl(),
            ]);
            
            if (!$paymentId) {
                Log::warning('Payment callback: Payment ID missing', [
                    'request_params' => $request->all(),
                ]);
                $errorUrl = route('payment.error.page') . '?' . http_build_query([
                    'status' => 'error',
                    'message' => __('common.payment_id_missing'),
                ]);
                return redirect($errorUrl);
            }

            // Get payment status from MyFatoorah
            $paymentStatus = $this->myFatoorahService->getPaymentStatus($paymentId);

            if (!$paymentStatus['IsSuccess']) {
                Log::warning('Payment verification failed', [
                    'paymentId' => $paymentId,
                    'message' => $paymentStatus['Message'] ?? 'Unknown error',
                ]);
                
                $errorUrl = route('payment.error.page') . '?' . http_build_query([
                    'status' => 'error',
                    'message' => $paymentStatus['Message'] ?? __('common.payment_verification_failed'),
                ]);
                return redirect($errorUrl);
            }

            $paymentData = $paymentStatus['Data'];
            $invoiceStatus = $paymentData->InvoiceStatus ?? '';
            $invoiceId = $paymentData->InvoiceId ?? $paymentId;

            if ($invoiceStatus === 'Paid') {
                // Get booking from PaymentTransaction
                // Try to find by invoiceId (as both string and integer) and paymentId
                // Remove notExpired() check since payment might complete after expiration
                // Note: invoice_id is stored as string in database, so convert both to string for comparison
                $invoiceIdString = (string)$invoiceId;
                $paymentTransaction = $this->paymentTransactionRepository->findByInvoiceIdOrPaymentId($invoiceIdString, $paymentId);
                    
                if (!$paymentTransaction) {
                    // Log all transactions for debugging
                    $allTransactions = $this->paymentTransactionRepository->getRecentTransactions(10)
                        ->map(function($t) {
                            return [
                                'id' => $t->id,
                                'invoice_id' => $t->invoice_id,
                                'invoice_id_type' => gettype($t->invoice_id),
                                'user_id' => $t->user_id,
                                'booking_id' => $t->booking_id,
                                'expires_at' => $t->expires_at?->toDateTimeString(),
                            ];
                        })->toArray();
                    
                    // Try to find by paymentId as well (in case invoice_id wasn't stored correctly)
                    $paymentTransactionByPaymentId = $this->paymentTransactionRepository->findByInvoiceId((string)$paymentId);
                    
                    if ($paymentTransactionByPaymentId) {
                        Log::info('Payment callback: Found transaction by paymentId instead of invoiceId', [
                            'paymentId' => $paymentId,
                            'invoiceId' => $invoiceId,
                            'found_transaction_id' => $paymentTransactionByPaymentId->id,
                        ]);
                        $paymentTransaction = $paymentTransactionByPaymentId;
                    } else {
                        Log::error('Payment callback: Payment transaction not found', [
                            'paymentId' => $paymentId,
                            'invoiceId' => $invoiceId,
                            'invoiceIdString' => $invoiceIdString,
                            'invoiceId_type' => gettype($invoiceId),
                            'paymentId_type' => gettype($paymentId),
                            'recent_transactions' => $allTransactions,
                        ]);
                        $errorUrl = route('payment.error.page') . '?' . http_build_query([
                            'status' => 'error',
                            'message' => __('common.payment_processing_error'),
                        ]);
                        return redirect($errorUrl);
                    }
                }

                $storedData = $paymentTransaction->payment_data;
                
                // Check if this is a wallet topup payment
                $isWalletTopup = isset($storedData['payment_type']) && $storedData['payment_type'] === 'wallet_topup';
                
                if ($isWalletTopup) {
                    return $this->handleWalletTopupCallback($paymentId, $invoiceId, $paymentTransaction->user_id, $storedData['amount'] ?? 0);
                }
                
                $bookingId = $storedData['booking_id'] ?? $paymentTransaction->booking_id ?? null;
                $paymentAmount = $storedData['payment_amount'] ?? 0;
                $totalAmount = $storedData['total_amount'] ?? 0;

                if (!$bookingId) {
                    Log::error('Payment callback: Booking ID missing', [
                        'paymentId' => $paymentId,
                        'invoiceId' => $invoiceId,
                    ]);
                    $errorUrl = route('payment.error.page') . '?' . http_build_query([
                        'status' => 'error',
                        'message' => __('common.payment_processing_error'),
                    ]);
                    return redirect($errorUrl);
                }

                // Get booking using repository
                $booking = $this->bookingRepository->find($bookingId);
                if ($booking && $booking->user_id !== $paymentTransaction->user_id) {
                    $booking = null; // User mismatch
                }
                    
                if (!$booking) {
                    Log::error('Payment callback: Booking not found', [
                        'paymentId' => $paymentId,
                        'booking_id' => $bookingId,
                    ]);
                    $errorUrl = route('payment.error.page') . '?' . http_build_query([
                        'status' => 'error',
                        'message' => __('common.booking_not_found'),
                    ]);
                    return redirect($errorUrl);
                }

                // Check if booking is already paid (prevent duplicate processing)
                if ($booking->payment_status === 'paid') {
                    Log::info('Payment callback: Booking already paid', [
                        'paymentId' => $paymentId,
                        'booking_id' => $booking->id,
                    ]);
                    
                    $successUrl = route('payment.success') . '?' . http_build_query([
                        'status' => 'success',
                        'amount' => $booking->total_amount,
                        'total_amount' => $booking->total_amount,
                        'booking_id' => $booking->id,
                        'payment_id' => $paymentId,
                    ]);
                    
                    return redirect($successUrl);
                }

                // Update booking payment status - all payments are full payments
                $this->withTransaction(function () use ($booking, $paymentAmount, $paymentId, $invoiceId, $totalAmount) {
                    $updateData = [
                        'payment_status' => 'paid',
                        'payment_type' => 'full',
                        'payment_transaction_id' => $invoiceId,
                    ];
                    
                    // Only auto-confirm if clinic has auto_confirm_bookings enabled
                    $booking->load('clinic');
                    if ($booking->clinic && $booking->clinic->auto_confirm_bookings) {
                        $updateData['status'] = 'accepted'; // Use 'accepted' instead of 'confirmed' to match enum
                        $updateData['confirmed_at'] = now();
                    }
                    // Otherwise, keep status as 'upcoming' for manual confirmation
                    
                    $this->bookingRepository->update($booking->id, $updateData);
                    
                    // Delete payment transaction after successful payment
                    if ($invoiceId) {
                        $invoiceIdString = (string)$invoiceId;
                        $this->paymentTransactionRepository->deleteByInvoiceId($invoiceIdString);
                    }
                    
                    // Refresh booking to get updated data
                    $booking->refresh();
                    $booking->load('clinic');
                    
                    Log::info('Payment callback: Booking payment updated successfully', [
                        'paymentId' => $paymentId,
                        'invoiceId' => $invoiceId,
                        'booking_id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'total_amount' => $totalAmount,
                        'payment_amount' => $paymentAmount,
                        'auto_confirmed' => $booking->clinic && $booking->clinic->auto_confirm_bookings,
                        'final_status' => $booking->status,
                    ]);
                });

                // Prepare success URL with query parameters
                $successUrl = route('payment.success') . '?' . http_build_query([
                    'status' => 'success',
                    'amount' => $paymentAmount,
                    'total_amount' => $totalAmount,
                    'booking_id' => $booking->id,
                    'payment_id' => $paymentId,
                ]);

                return redirect($successUrl);

            } else {
                // Payment failed/cancelled
                Log::info('Payment failed or cancelled', [
                    'paymentId' => $paymentId,
                    'invoiceStatus' => $invoiceStatus,
                ]);
                
                // Payment failed - keep payment_status as 'pending' (failed is not in enum)
                $paymentTransaction = $this->paymentTransactionRepository->findByInvoiceId($invoiceId);
                if ($paymentTransaction && $paymentTransaction->booking_id) {
                    $booking = $this->bookingRepository->find($paymentTransaction->booking_id);
                    if ($booking && $booking->payment_status !== 'paid') {
                        // Keep payment_status as 'pending' since 'failed' is not in enum
                        // Status remains unchanged (stays as 'upcoming' or current status)
                        Log::info('Payment failed - booking payment status remains pending', [
                            'booking_id' => $booking->id,
                            'invoiceId' => $invoiceId,
                        ]);
                    }
                }
                
                $errorUrl = route('payment.error.page') . '?' . http_build_query([
                    'status' => 'error',
                    'message' => __('common.payment_not_completed'),
                ]);
                return redirect($errorUrl);
            }

        } catch (\Throwable $e) {
            Log::error('Payment callback exception', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'paymentId' => $request->get('paymentId'),
                'url' => $request->fullUrl(),
            ]);

            try {
                $errorUrl = route('payment.error.page') . '?' . http_build_query([
                    'status' => 'error',
                    'message' => __('common.payment_processing_error'),
                ]);
                return redirect($errorUrl);
            } catch (\Exception $redirectException) {
                // If redirect fails, return a simple HTML response
                Log::error('Payment callback redirect failed', [
                    'error' => $redirectException->getMessage(),
                ]);
                return response('<html><body><h1>Payment Processing Error</h1><p>Please contact support.</p></body></html>', 500)
                    ->header('Content-Type', 'text/html');
            }
        }
    }

    /**
     * Payment error callback
     */
    public function error(Request $request)
    {
        Log::warning('Payment error callback accessed', [
            'request' => $request->all()
        ]);

        // Try to get invoice ID from request to update booking status
        $paymentId = $request->get('paymentId') ?? $request->get('Id');
        if ($paymentId) {
            // Convert to string since database stores invoice_id as string
            $paymentIdString = (string)$paymentId;
            $paymentTransaction = $this->paymentTransactionRepository->findByInvoiceId($paymentIdString);
            if ($paymentTransaction && $paymentTransaction->booking_id) {
                $booking = $this->bookingRepository->find($paymentTransaction->booking_id);
                if ($booking && $booking->payment_status !== 'paid') {
                    // Keep payment_status as 'pending' since 'failed' is not in enum
                    Log::info('Payment error - booking payment status remains pending', [
                        'booking_id' => $booking->id,
                        'paymentId' => $paymentId,
                    ]);
                }
            }
        }

        $errorUrl = route('payment.error.page') . '?' . http_build_query([
            'status' => 'error',
            'message' => __('common.payment_cancelled_or_failed'),
        ]);
        return redirect($errorUrl);
    }

    /**
     * MyFatoorah webhook
     */
    public function webhook(Request $request)
    {
        try {
            Log::info('MyFatoorah webhook received', [
                'payload' => $request->all()
            ]);

            $data = $request->all();
            $invoiceId = $data['Data']['InvoiceId'] ?? null;
            $status = $data['Data']['InvoiceStatus'] ?? null;

            if ($invoiceId && $status === 'Paid') {
                // Find booking via PaymentTransaction table
                // Convert invoiceId to string since database stores it as string
                $invoiceIdString = (string)$invoiceId;
                $paymentTransaction = $this->paymentTransactionRepository->findByInvoiceId($invoiceIdString);
                // Check if expired
                if ($paymentTransaction && $paymentTransaction->expires_at && $paymentTransaction->expires_at->isPast()) {
                    $paymentTransaction = null; // Treat as expired
                }

                if ($paymentTransaction) {
                    $bookingId = $paymentTransaction->booking_id ?? ($paymentTransaction->payment_data['booking_id'] ?? null);
                    
                    if ($bookingId) {
                        $booking = $this->bookingRepository->find($bookingId);
                        // Validate user and payment status
                        if ($booking && ($booking->user_id !== $paymentTransaction->user_id || $booking->payment_status === 'paid')) {
                            $booking = null;
                        }

                        if ($booking) {
                            $this->withTransaction(function () use ($booking, $invoiceId) {
                                $updateData = [
                                    'payment_status' => 'paid',
                                    'payment_type' => 'full',
                                    'payment_transaction_id' => $invoiceId,
                                ];
                                
                                // Only auto-confirm if clinic has auto_confirm_bookings enabled
                                $booking->load('clinic');
                                if ($booking->clinic && $booking->clinic->auto_confirm_bookings) {
                                    $updateData['status'] = 'accepted'; // Use 'accepted' instead of 'confirmed' to match enum
                                    $updateData['confirmed_at'] = now();
                                }
                                // Otherwise, keep status as 'upcoming' for manual confirmation
                                
                                $this->bookingRepository->update($booking->id, $updateData);

                                // Delete payment transaction after successful payment
                                $invoiceIdString = (string)$invoiceId;
                                $this->paymentTransactionRepository->deleteByInvoiceId($invoiceIdString);

                                Log::info('Webhook: Booking updated successfully', [
                                    'invoice_id' => $invoiceId,
                                    'booking_id' => $booking->id,
                                    'booking_reference' => $booking->booking_reference,
                                    'auto_confirmed' => $booking->clinic && $booking->clinic->auto_confirm_bookings,
                                    'final_status' => $booking->status,
                                ]);
                            });
                        }
                    }
                }
            } elseif ($invoiceId && in_array($status, ['Failed', 'Canceled'])) {
                // Payment failed - keep payment_status as 'pending' (failed is not in enum)
                // Convert invoiceId to string since database stores it as string
                $invoiceIdString = (string)$invoiceId;
                $paymentTransaction = $this->paymentTransactionRepository->findByInvoiceId($invoiceIdString);
                if ($paymentTransaction && $paymentTransaction->booking_id) {
                    $booking = $this->bookingRepository->find($paymentTransaction->booking_id);
                    if ($booking && $booking->payment_status !== 'paid') {
                        // Keep payment_status as 'pending' since 'failed' is not in enum
                        // Status remains unchanged (stays as 'upcoming' or current status)
                        Log::info('Webhook: Payment failed - booking payment status remains pending', [
                            'invoice_id' => $invoiceId,
                            'booking_id' => $booking->id,
                            'status' => $status,
                        ]);
                    }
                }
            }

            return response()->json(['success' => true], 200);

        } catch (\Exception $e) {
            Log::error('Webhook processing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle wallet topup payment callback
     */
    private function handleWalletTopupCallback(string $paymentId, string $invoiceId, int $userId, float $amount)
    {
        try {
            // Check if wallet topup already processed (prevent duplicate processing) using repository
            $existingTransaction = $this->walletTransactionRepository->findBy([
                'reference' => $invoiceId,
                'type' => 'topup',
                'status' => 'completed',
            ]);

            if ($existingTransaction) {
                Log::info('Wallet topup callback: Already processed', [
                    'paymentId' => $paymentId,
                    'invoiceId' => $invoiceId,
                    'userId' => $userId,
                ]);

                session()->forget(['wallet_topup_amount', 'wallet_topup_user_id', 'wallet_topup_invoice_id']);

                $successUrl = route('payment.success') . '?' . http_build_query([
                    'status' => 'success',
                    'payment_type' => 'wallet_topup',
                    'amount' => $amount,
                ]);

                return redirect($successUrl);
            }

            // Process wallet topup
            $this->withTransaction(function () use ($userId, $amount, $invoiceId) {
                $wallet = $this->walletRepository->topUp($userId, $amount, 'myfatoorah', $invoiceId);

                Log::info('Wallet topup callback: Successfully processed', [
                    'userId' => $userId,
                    'amount' => $amount,
                    'invoiceId' => $invoiceId,
                    'new_balance' => $wallet->balance,
                ]);
            });

            session()->forget(['wallet_topup_amount', 'wallet_topup_user_id', 'wallet_topup_invoice_id']);

            $successUrl = route('payment.success') . '?' . http_build_query([
                'status' => 'success',
                'payment_type' => 'wallet_topup',
                'amount' => $amount,
            ]);

            return redirect($successUrl);

        } catch (\Exception $e) {
            Log::error('Wallet topup callback exception', [
                'error' => $e->getMessage(),
                'paymentId' => $paymentId,
                'invoiceId' => $invoiceId,
                'userId' => $userId,
                'amount' => $amount,
            ]);

            session()->forget(['wallet_topup_amount', 'wallet_topup_user_id', 'wallet_topup_invoice_id']);

            return redirect('/payment-error?status=error&message=' . urlencode(__('common.wallet_topup_processing_error')));
        }
    }
}

