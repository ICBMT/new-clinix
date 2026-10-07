<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Wallet\TopUpRequest;
use App\Http\Resources\Api\V1\Wallet\WalletResource;
use App\Http\Resources\Api\V1\Wallet\WalletTransactionResource;
use App\Contracts\WalletRepositoryInterface;
use App\Services\Api\V1\MyFatoorahService;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly MyFatoorahService $myFatoorahService
    ) {}

    /**
     * Get wallet balance
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();
        $wallet = $this->walletRepository->getUserWallet($user->id);

        return response()->json([
            'success' => true,
            'data' => new WalletResource($wallet)
        ]);
    }

    /**
     * Get wallet transactions with date filtering
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $transactions = $this->walletRepository->getTransactions($user->id, $perPage, $dateFrom, $dateTo);

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => WalletTransactionResource::collection($transactions->items()),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ]
            ]
        ]);
    }

    /**
     * Top up wallet - Generate payment link
     */
    public function topUp(TopUpRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $amount = (float) $data['amount'];
        
        if ($amount <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('common.invalid_amount'),
                'errors' => ['amount' => [__('common.invalid_amount')]],
            ], 422);
        }

        // Format amount to 3 decimal places for KWD (Kuwaiti Dinar uses 3 decimal places)
        $formattedAmount = number_format($amount, 3, '.', '');

        // Store topup intent in session
        session()->put([
            'wallet_topup_amount' => $amount,
            'wallet_topup_user_id' => $user->id,
            'payment_method_id' => $data['payment_method_id'],
        ]);
        session()->save();

        // Prepare payment data for MyFatoorah
        $paymentData = [
            'PaymentMethodId' => $data['payment_method_id'],
            'InvoiceValue' => $formattedAmount,
            'CallBackUrl' => url(route('payment.callback', [], false)),
            'ErrorUrl' => url(route('payment.error', [], false)),
            'CustomerName' => $user->name,
            'CustomerEmail' => $user->email ?? 'noreply@example.com',
            'CustomerMobile' => $user->phone,
        ];

        // Generate payment link via MyFatoorah
        $result = $this->myFatoorahService->initiateRedirectPayment($user, $amount, $paymentData);

        if ($result['IsSuccess']) {
            $invoiceId = $result['Data']['InvoiceId'];
            
            // Store invoice ID in session
            session()->put('wallet_topup_invoice_id', $invoiceId);
            session()->save();
            
            // Store topup data in database as fallback (in case session is lost)
            PaymentTransaction::updateOrCreate(
                ['invoice_id' => $invoiceId],
                [
                    'user_id' => $user->id,
                    'invoice_id' => $invoiceId,
                    'payment_data' => [
                        'payment_type' => 'wallet_topup', // Key indicator: This is a wallet topup, not booking
                        'amount' => $amount,
                        'payment_method_id' => $data['payment_method_id'],
                    ],
                    'expires_at' => now()->addHours(24), // Expire after 24 hours
                ]
            );
            
            return response()->json([
                'success' => true,
                'message' => __('common.payment_link_generated'),
                'data' => [
                    'payment_method' => 'myfatoorah',
                    'payment_url' => $result['Data']['PaymentURL'],
                    'invoice_id' => $invoiceId,
                    'amount' => $amount,
                ]
            ]);
        } else {
            // Payment gateway initiation failed - clear session
            session()->forget(['wallet_topup_amount', 'wallet_topup_user_id', 'wallet_topup_invoice_id', 'payment_method_id']);
            
            return response()->json([
                'success' => false,
                'message' => $result['Message'] ?? __('common.payment_link_generation_failed'),
                'errors' => ['payment' => [$result['Message'] ?? __('common.payment_link_generation_failed')]],
            ], 422);
        }
    }
}
