<?php

namespace App\Contracts;

use App\Contracts\BaseRepositoryInterface;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface ActivityLogRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get paginated activity logs with filters
     */
    public function getPaginated(Request $request, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get activity logs by causer
     */
    public function getByCauser(string $causerType, int $causerId, int $perPage = 10): \Illuminate\Pagination\LengthAwarePaginator;

    /**
     * Delete all activity logs
     */
    public function deleteAll(?\App\Models\User $causer = null): bool;
}
