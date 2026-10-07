<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface PaymentRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get user payment methods
     * @param int $userId
     * @param string|null $platform Filter by platform (ios, android, web)
     */
    public function getUserPaymentMethods(int $userId, ?string $platform = null): array;

    /**
     * Get user payments
     */
    public function getUserPayments(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Execute payment
     */
    public function executePayment(array $data, int $userId): array;

    /**
     * Refund payment
     */
    public function refundPayment(string $transactionId, array $data, int $userId): array;
}
