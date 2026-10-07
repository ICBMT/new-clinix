<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payment\ExecutePaymentRequest;
use App\Http\Resources\Api\V1\Profile\PaymentMethodResource;
use App\Contracts\PaymentRepositoryInterface;
use App\Contracts\BookingRepositoryInterface;
use App\Contracts\PaymentTransactionRepositoryInterface;
use App\Contracts\WalletRepositoryInterface;
use App\Contracts\WalletTransactionRepositoryInterface;
use App\Contracts\TransactionRepositoryInterface;
use App\Services\Api\V1\MyFatoorahService;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentRepositoryInterface $paymentRepository,
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly PaymentTransactionRepositoryInterface $paymentTransactionRepository,
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly WalletTransactionRepositoryInterface $walletTransactionRepository,
        private readonly TransactionRepositoryInterface $transactionRepository,
        private readonly MyFatoorahService $myFatoorahService
    ) {}

    /**
     * Get payment methods
     * Accepts optional platform parameter (ios, android, web)
     */
    public function methods(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $request->validate([
                'platform' => ['nullable', 'string', 'in:ios,android,web']
            ]);

            $user = $request->user();
        $platform = $request->input('platform');
        
        $methods = $this->paymentRepository->getUserPaymentMethods($user->id, $platform);

            return response()->json([
                'success' => true,
                'data' => [
                    'payment_methods' => PaymentMethodResource::collection($methods),
                    'platform' => $platform,
                ]
            ]);
        });
    }

    /**
     * Execute payment for a booking
     * Only accepts booking_id and payment_method_id
     * Always does full payment
     */
    public function execute(ExecutePaymentRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $user = $request->user();

            // Get booking using repository
            $booking = $this->bookingRepository->findBy([
                'id' => $data['booking_id'],
                'user_id' => $user->id,
            ]);

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                    'errors' => ['booking_id' => [__('common.booking_not_found')]],
                ], 404);
            }

            // Check if booking is already paid
            if ($booking->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_already_paid'),
                    'errors' => ['booking_id' => [__('common.booking_already_paid')]],
                ], 422);
            }

            // Always full payment
            $paymentAmount = (float) $booking->total_amount;
            $totalAmount = $paymentAmount;

            if ($paymentAmount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.invalid_payment_amount'),
                    'errors' => ['amount' => [__('common.invalid_payment_amount')]],
                ], 422);
            }

            // Check payment method - wallet or myfatoorah
            $paymentMethod = $data['payment_method'] ?? 'myfatoorah'; // Default to myfatoorah for backward compatibility

            // Handle wallet payment
            if ($paymentMethod === 'wallet') {
                return DB::transaction(function () use ($user, $booking, $paymentAmount) {
                    $wallet = $this->walletRepository->getUserWallet($user->id);
                    if (!$wallet || $wallet->balance < $paymentAmount) {
                        return response()->json([
                            'success' => false,
                            'message' => __('common.insufficient_wallet_balance'),
                            'errors' => ['wallet' => [__('common.insufficient_wallet_balance')]],
                        ], 422);
                    }

                    // Deduct from wallet using repository pattern
                    $balanceBefore = $wallet->balance;
                    $wallet->decrement('balance', $paymentAmount);
                    $wallet->refresh();
                    $balanceAfter = $wallet->balance;

                    // Create wallet transaction record using repository
                    $this->walletTransactionRepository->create([
                        'wallet_id' => $wallet->id,
                        'user_id' => $user->id,
                        'type' => 'payment',
                        'amount' => $paymentAmount,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $balanceAfter,
                        'currency' => $wallet->currency,
                        'description' => 'Booking payment',
                        'reference' => 'BK-' . $booking->id,
                        'status' => 'completed',
                    ]);

                    // Update booking payment status
                    $this->bookingRepository->update($booking->id, [
                        'payment_status' => 'paid',
                        'payment_type' => 'full',
                    ]);

                    // Create transaction record using repository
                    $this->transactionRepository->create([
                        'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                        'transactionable_type' => Booking::class,
                        'transactionable_id' => $booking->id,
                        'type' => 'booking',
                        'amount' => $paymentAmount,
                        'currency' => 'KWD',
                        'payment_method' => 'wallet',
                        'status' => 'completed',
                        'processed_at' => now(),
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => __('common.payment_successful'),
                        'data' => [
                            'payment_method' => 'wallet',
                            'amount_paid' => $paymentAmount,
                            'booking' => [
                                'id' => $booking->id,
                                'payment_status' => 'paid',
                            ],
                        ]
                    ]);
                });
            }

            // MyFatoorah payment flow
            // Prepare payment data for MyFatoorah
            // Use absolute URLs for callbacks (MyFatoorah requires absolute URLs)
            $paymentData = [
                'PaymentMethodId' => $data['payment_method_id'],
                'InvoiceValue' => $paymentAmount,
                'CallBackUrl' => url(route('payment.callback', [], false)),
                'ErrorUrl' => url(route('payment.error', [], false)),
                'CustomerName' => $booking->patient_name ?? $user->name,
                'CustomerEmail' => $user->email ?? 'noreply@example.com',
                'CustomerMobile' => $booking->patient_phone ?? $user->phone,
            ];

            // Initiate payment with MyFatoorah
            $result = $this->myFatoorahService->initiateRedirectPayment($user, $paymentAmount, $paymentData);

            if ($result['IsSuccess']) {
                $invoiceId = $result['Data']['InvoiceId'];
                
                // Create pending payment transaction using repository
                $paymentTransactionData = [
                    'user_id' => $user->id,
                    'booking_id' => $booking->id,
                    'invoice_id' => $invoiceId,
                    'payment_data' => [
                        'booking_id' => $booking->id,
                        'payment_amount' => $paymentAmount,
                        'payment_type' => 'full',
                        'total_amount' => $totalAmount,
                    ],
                    'expires_at' => now()->addHours(24),
                ];
                
                // Check if transaction exists using repository method
                $existingTransaction = $this->paymentTransactionRepository->findByInvoiceId($invoiceId);
                if ($existingTransaction) {
                    $this->paymentTransactionRepository->update($existingTransaction->id, $paymentTransactionData);
                } else {
                    $this->paymentTransactionRepository->create($paymentTransactionData);
                }
                
                return response()->json([
                    'success' => true,
                    'message' => __('common.payment_initiated'),
                    'data' => [
                        'payment_url' => $result['Data']['PaymentURL'],
                        'invoice_id' => $invoiceId,
                        'amount' => $paymentAmount,
                        'success_url' => url(route('payment.success', [], false)),
                        'error_url' => url(route('payment.error.page', [], false)),
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['Message'] ?? __('common.payment_failed'),
                    'errors' => ['payment' => [$result['Message'] ?? __('common.payment_failed')]],
                ], 422);
            }
        });
    }
}
