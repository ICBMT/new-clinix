<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface AddressRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get user addresses
     */
    public function getUserAddresses(int $userId): \Illuminate\Database\Eloquent\Collection;

    /**
     * Verify address belongs to user
     */
    public function verifyUserAddress(int $addressId, int $userId): ?\App\Models\Address;

    /**
     * Set default address
     */
    public function setDefault(int $addressId, int $userId): bool;
}
