<?php

namespace App\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface WalletRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get user wallet
     */
    public function getUserWallet(int $userId): \App\Models\Wallet;

    /**
     * Get wallet transactions with date filtering
     */
    public function getTransactions(int $userId, int $perPage = 15, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator;

    /**
     * Top up wallet
     */
    public function topUp(int $userId, float $amount, string $paymentMethod, ?string $reference = null): \App\Models\Wallet;

    /**
     * Add refund amount to user wallet
     */
    public function addRefund(int $userId, float $amount, string $description, ?string $reference = null, $referenceModel = null): \App\Models\Wallet;
}

