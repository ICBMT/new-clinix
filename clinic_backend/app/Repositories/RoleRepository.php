<?php

namespace App\Repositories;

use App\Contracts\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    /**
     * RoleRepository constructor
     */
    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    /**
     * Get searchable fields - only text fields
     */
    protected function getSearchableFields(): array
    {
        return ['name'];
    }

    /**
     * Get paginated roles with filters
     */
    public function getPaginated(Request $request, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Exclude system roles: super-admin, clinic, clinic_manager, user, guest
        $query->whereNotIn('name', ['super-admin', 'clinic', 'clinic_manager', 'user', 'guest']);

        $query = $this->applyFilters($query, $request);
        $query = $this->applyCustomFilters($query, $request);
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        // Add user counts
        $query->withCount('users');

        return $query->paginate($perPage);
    }

    /**
     * Apply custom filters specific to roles
     */
    protected function applyCustomFilters(Builder $query, Request $request): Builder
    {
        $filters = $request->get('filters', []);

        // Filter by created date range
        if (isset($filters['created_from']) && !empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (isset($filters['created_to']) && !empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        // Filter by permission
        if (isset($filters['permission']) && !empty($filters['permission'])) {
            $query->whereHas('permissions', function ($q) use ($filters) {
                $q->where('name', $filters['permission']);
            });
        }

        // Filter by has users
        if (isset($filters['has_users'])) {
            if ($filters['has_users'] === 'yes') {
                $query->has('users');
            } elseif ($filters['has_users'] === 'no') {
                $query->doesntHave('users');
            }
        }

        return $query;
    }

    /**
     * Get role with permissions
     */
    public function getWithPermissions(int $id): Role
    {
        return $this->model->with('permissions')->findOrFail($id);
    }

    /**
     * Create role with permissions
     */
    public function createWithPermissions(array $data, array $permissions = []): Role
    {
        return $this->withTransaction(function () use ($data, $permissions) {
            $role = $this->create($data);
            
            if (!empty($permissions)) {
                $role->syncPermissions($permissions);
            }
            
            return $role->fresh(['permissions']);
        });
    }

    /**
     * Update role with permissions
     */
    public function updateWithPermissions(int $id, array $data, array $permissions = []): Role
    {
        return $this->withTransaction(function () use ($id, $data, $permissions) {
            $role = $this->update($id, $data);
            
            // Always sync permissions (empty array clears all)
            $role->syncPermissions($permissions);
            
            return $role->fresh(['permissions']);
        });
    }
}
