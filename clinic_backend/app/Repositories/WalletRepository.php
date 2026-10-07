<?php

namespace App\Repositories;

use App\Contracts\WalletRepositoryInterface;
use App\Contracts\WalletTransactionRepositoryInterface;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class WalletRepository extends BaseRepository implements WalletRepositoryInterface
{
    protected array $searchableFields = [];

    protected array $filterableFields = [
        'user_id',
        'status',
    ];

    public function __construct(
        Wallet $model,
        private readonly WalletTransactionRepositoryInterface $walletTransactionRepository
    ) {
        parent::__construct($model);
    }

    public function getUserWallet(int $userId): Wallet
    {
        return $this->model->where('user_id', $userId)->firstOrCreate(['user_id' => $userId]);
    }

    public function getTransactions(int $userId, int $perPage = 15, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator
    {
        $query = WalletTransaction::where('user_id', $userId);

        // Apply date filtering
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function topUp(int $userId, float $amount, string $paymentMethod, ?string $reference = null): Wallet
    {
        return DB::transaction(function () use ($userId, $amount, $paymentMethod, $reference) {
            $wallet = $this->getUserWallet($userId);
            $balanceBefore = $wallet->balance;
            $wallet->increment('balance', $amount);
            $wallet->refresh();
            $balanceAfter = $wallet->balance;

            // Create wallet transaction record using repository pattern
            $this->walletTransactionRepository->create([
                'wallet_id' => $wallet->id,
                'user_id' => $userId,
                'type' => 'topup',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => $wallet->currency,
                'description' => "Wallet topup via {$paymentMethod}",
                'reference' => $reference,
                'status' => 'completed',
            ]);

            return $wallet->fresh();
        });
    }

    /**
     * Add refund amount to user wallet
     */
    public function addRefund(int $userId, float $amount, string $description, ?string $reference = null, $referenceModel = null): Wallet
    {
        return DB::transaction(function () use ($userId, $amount, $description, $reference, $referenceModel) {
            $wallet = $this->getUserWallet($userId);
            $balanceBefore = $wallet->balance;
            $wallet->increment('balance', $amount);
            $wallet->refresh();
            $balanceAfter = $wallet->balance;

            // Create wallet transaction record
            $transactionData = [
                'wallet_id' => $wallet->id,
                'user_id' => $userId,
                'type' => 'refund',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => $wallet->currency,
                'description' => $description,
                'reference' => $reference,
                'status' => 'completed',
            ];

            // Add polymorphic reference if provided
            if ($referenceModel) {
                $transactionData['reference_id'] = $referenceModel->id;
                $transactionData['reference_type'] = get_class($referenceModel);
            }

            $this->walletTransactionRepository->create($transactionData);

            return $wallet->fresh();
        });
    }

}

