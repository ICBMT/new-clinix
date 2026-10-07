<?php

namespace App\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use App\Models\Role;

interface RoleRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get paginated roles with optional filtering
     */
    public function getPaginated(Request $request, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get role with permissions
     */
    public function getWithPermissions(int $id): Role;

    /**
     * Create role with permissions
     */
    public function createWithPermissions(array $data, array $permissions = []): Role;

    /**
     * Update role with permissions
     */
    public function updateWithPermissions(int $id, array $data, array $permissions = []): Role;
}
