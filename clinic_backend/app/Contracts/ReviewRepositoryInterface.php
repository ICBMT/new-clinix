<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReviewRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get paginated reviews with role-based filtering
     */
    public function getPaginatedWithRoleFilter(Request $request, int $perPage = 15, ?array $accessibleClinicIds = null, ?int $userId = null): LengthAwarePaginator;
}

