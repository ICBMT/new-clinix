<?php

namespace App\Repositories;

use App\Contracts\AddressRepositoryInterface;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressRepository extends BaseRepository implements AddressRepositoryInterface
{
    protected array $searchableFields = [
        'title',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
    ];

    protected array $filterableFields = [
        'user_id',
        'type',
        'is_default',
    ];

    /**
     * Get user addresses
     */
    public function getUserAddresses(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Verify address belongs to user
     */
    public function verifyUserAddress(int $addressId, int $userId): ?Address
    {
        return $this->model->where('id', $addressId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Set default address
     */
    public function setDefault(int $addressId, int $userId): bool
    {
        // First, unset all default addresses for this user
        $this->model
            ->where('user_id', $userId)
            ->update(['is_default' => false]);

        // Set this address as default
        return $this->model
            ->where('id', $addressId)
            ->where('user_id', $userId)
            ->update(['is_default' => true]);
    }
}

