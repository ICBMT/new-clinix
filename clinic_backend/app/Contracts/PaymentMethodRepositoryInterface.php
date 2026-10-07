<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface PaymentMethodRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get user payment methods
     * @param int $userId
     * @param string|null $platform Filter by platform (ios, android, web)
     */
    public function getUserPaymentMethods(int $userId, ?string $platform = null): array;

    /**
     * Set default payment method
     */
    public function setDefault(int $paymentMethodId, int $userId): bool;
}
