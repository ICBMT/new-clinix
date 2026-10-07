<?php

namespace App\Repositories;

use App\Contracts\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

/**
 * UserRepository
 * 
 * User-specific repository implementation
 * Extends BaseRepository (which uses RepositoryOperations trait for common CRUD)
 * Adds user-specific methods
 */
class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    /**
     * UserRepository constructor
     */
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    /**
     * Get searchable fields for full-text search optimization
     * Only include text fields that have full-text index
     */
    protected function getSearchableFields(): array
    {
        return [
            'name',
            'email',
            'phone',
            'description_en',
            'description_ar',
        ];
    }


    /**
     * Enable full-text search for users (much faster for 1M+ records)
     */
    protected function useFullTextSearch(): bool
    {
        return config('database.default') === 'mysql';
    }

    /**
     * Apply custom user filters
     */
    protected function applyCustomFilters(Builder $query, Request $request): Builder
    {
        $filters = $request->get('filters', []);

        // Status filter (for vendors)
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Verification status filter (vendor KYC) - now in profiles table
        if (isset($filters['verification_status']) && !empty($filters['verification_status'])) {
            $query->whereHas('profile', function ($q) use ($filters) {
                $q->where('verification_status', $filters['verification_status']);
            });
        }

        // Email verification status filter
        if (isset($filters['email_verified'])) {
            if ($filters['email_verified'] === 'verified') {
                $query->whereNotNull('email_verified_at');
            } elseif ($filters['email_verified'] === 'not_verified') {
                $query->whereNull('email_verified_at');
            }
        }

        // Phone verification status filter
        if (isset($filters['phone_verified'])) {
            if ($filters['phone_verified'] === 'verified') {
                $query->whereNotNull('phone_verified_at');
            } elseif ($filters['phone_verified'] === 'not_verified') {
                $query->whereNull('phone_verified_at');
            }
        }

        // Created date range filter
        if (isset($filters['created_from']) && !empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }
        if (isset($filters['created_to']) && !empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        // Last login date range filter
        if (isset($filters['last_login_from']) && !empty($filters['last_login_from'])) {
            $query->whereDate('last_login_at', '>=', $filters['last_login_from']);
        }
        if (isset($filters['last_login_to']) && !empty($filters['last_login_to'])) {
            $query->whereDate('last_login_at', '<=', $filters['last_login_to']);
        }

        return $query;
    }

    /**
     * Validate and transform user data (DRY - used by all hooks)
     */
    protected function validateAndTransformUserData(array $data): array
    {
        // Validate Kuwait phone format only if phone is provided and not null
        if (isset($data['phone']) && $data['phone'] !== null && $data['phone'] !== '') {
            $this->validateKuwaitPhone($data['phone']);
        }

        // Hash password only if provided
        if (isset($data['password']) && $data['password'] !== null && $data['password'] !== '') {
            $data['password'] = $this->hashPassword($data['password']);
        }

        return $data;
    }

    /**
     * Validate Kuwait phone number format
     */
    protected function validateKuwaitPhone(string $phone): void
    {
        if (!preg_match('/^\+965\d{8}$/', $phone)) {
            throw new \InvalidArgumentException(__('common.kuwait_phone_invalid_format', ['attribute' => 'phone']));
        }
    }

    /**
     * Hash password securely
     */
    protected function hashPassword(string $password): string
    {
        return Hash::make($password);
    }

    /**
     * Hook: Before create
     */
    protected function beforeCreate(array $data): array
    {
        return $this->validateAndTransformUserData($data);
    }

    /**
     * Hook: Before update
     */
    protected function beforeUpdate($record, array $data): array
    {
        return $this->validateAndTransformUserData($data);
    }

    /**
     * Hook: Before bulk update
     */
    protected function beforeBulkUpdate(array $ids, array $data): array
    {
        return $this->validateAndTransformUserData($data);
    }

    /**
     * USER-SPECIFIC METHODS
     */

    /**
     * Get users by role
     */
    public function getByRole(string $roleName): Collection
    {
        return $this->model->whereHas('roles', function ($q) use ($roleName) {
            $q->where('name', $roleName);
        })->get();
    }

    /**
     * Get users by status
     */
    public function getByStatus(string $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    /**
     * Get users by verification_status
     */
    public function getByVerificationStatus(string $status): Collection
    {
        return $this->model->where('verification_status', $status)->get();
    }

    /**
     * Get active vendors
     */
    public function getActiveVendors(): Collection
    {
        return $this->model
            ->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })
            ->where('status', 'active')
            ->get();
    }

    /**
     * Get inactive vendors
     */
    public function getInactiveVendors(): Collection
    {
        return $this->model
            ->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })
            ->where('status', 'inactive')
            ->get();
    }

    /**
     * Get verified vendors (approved)
     */
    public function getVerifiedVendors(): Collection
    {
        return $this->model
            ->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })
            ->where('verification_status', 'approved')
            ->get();
    }

    /**
     * Get pending vendors
     */
    public function getPendingVendors(): Collection
    {
        return $this->model
            ->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })
            ->where('verification_status', 'pending')
            ->get();
    }

    /**
     * Get rejected vendors
     */
    public function getRejectedVendors(): Collection
    {
        return $this->model
            ->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })
            ->where('verification_status', 'rejected')
            ->get();
    }

    /**
     * Get users by role with pagination
     */
    public function getByRolePaginated(string $roleName, Request $request, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->whereHas('roles', function ($q) use ($roleName) {
            $q->where('name', $roleName);
        });

        // Apply common filters using helper
        $query = $this->applyFilters($query, $request);
        $query = $this->applyCustomFilters($query, $request); // Add custom user filters
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        return $query->paginate($perPage);
    }

    /**
     * Update user status
     */
    public function updateStatus(int $id, string $status, string $rejectionReason = null): User
    {
        return $this->withTransaction(function () use ($id, $status, $rejectionReason) {
            $data = ['status' => $status];

            if ($status === 'rejected' && $rejectionReason) {
                $data['rejection_reason'] = $rejectionReason;
            }

            return $this->update($id, $data);
        });
    }

    /**
     * Update verification_status and optional rejection reason
     */
    public function updateVerificationStatus(int $id, string $status, string $rejectionReason = null): User
    {
        return $this->withTransaction(function () use ($id, $status, $rejectionReason) {
            $user = $this->find($id);
            
            // Update profile instead of user
            $profileData = ['verification_status' => $status];
            if ($status === 'rejected') {
                $profileData['rejection_reason'] = $rejectionReason;
            } elseif ($status === 'approved') {
                // clear rejection reason upon approval
                $profileData['rejection_reason'] = null;
            }
            
            // Update or create profile
            if ($user->profile) {
                $user->profile->update($profileData);
            } else {
                $user->profile()->create($profileData);
            }
            
            return $user->fresh();
        });
    }

    /**
     * Approve vendor
     */
    public function approveVendor(int $id): User
    {
        return $this->updateVerificationStatus($id, 'approved');
    }

    /**
     * Reject vendor
     */
    public function rejectVendor(int $id, string $reason): User
    {
        return $this->updateVerificationStatus($id, 'rejected', $reason);
    }

    /**
     * Get users with recent activity
     */
    public function getRecentActivity(int $days = 7): Collection
    {
        return $this->model
            ->where('last_login_at', '>=', now()->subDays($days))
            ->orderBy('last_login_at', 'desc')
            ->get();
    }

    /**
     * Get admin users with pagination (excluding super-admin, current user, clinic, clinic_manager, user, guest roles)
     */
    public function getAdminUsersPaginated(Request $request, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Exclude users with these roles: super-admin, clinic, clinic_manager, user, guest
        $query->whereDoesntHave('roles', function ($q) {
            $q->whereIn('name', ['super-admin', 'clinic', 'clinic_manager', 'user', 'guest']);
        });

        // Exclude current logged-in user
        $authUser = \Illuminate\Support\Facades\Auth::user();
        if ($authUser) {
            $query->where('id', '!=', $authUser->id);
        }

        $query = $this->applyFilters($query, $request);
        $query = $this->applyCustomFilters($query, $request);
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        return $query->paginate($perPage);
    }

    /**
     * Get role statistics
     */
    public function getRoleStatistics(): array
    {
        return [
            'vendor' => $this->model->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })->count(),
            'user' => $this->model->whereHas('roles', function ($q) {
                $q->where('name', 'user');
            })->count(),
            'guest' => $this->model->whereHas('roles', function ($q) {
                $q->where('name', 'guest');
            })->count(),
        ];
    }

    /**
     * Get status statistics
     */
    public function getStatusStatistics(): array
    {
        return [
            'active' => $this->model->where('status', 'active')->count(),
            'inactive' => $this->model->where('status', 'inactive')->count(),
        ];
    }

    /**
     * Get verification statistics (pending/approved/rejected)
     */
    public function getVerificationStatistics(): array
    {
        return [
            'pending' => $this->model->where('verification_status', 'pending')->count(),
            'approved' => $this->model->where('verification_status', 'approved')->count(),
            'rejected' => $this->model->where('verification_status', 'rejected')->count(),
        ];
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStatistics(): array
    {
        return [
            'total_users' => $this->model->count(),
            'new_users_today' => $this->model->whereDate('created_at', today())->count(),
            'new_users_this_month' => $this->model->whereMonth('created_at', now()->month)->count(),
            'active_users_today' => $this->model->whereDate('last_login_at', today())->count(),
            'active_vendors' => $this->model->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })->where('status', 'active')->count(),
            'inactive_vendors' => $this->model->whereHas('roles', function ($q) {
                $q->where('name', 'vendor');
            })->where('status', 'inactive')->count(),
            'verification_breakdown' => $this->getVerificationStatistics(),
            'role_breakdown' => $this->getRoleStatistics(),
            'status_breakdown' => $this->getStatusStatistics(),
        ];
    }

    /**
     * Advanced search with multiple criteria
     */
    public function advancedSearch(Request $request): Collection
    {
        $query = $this->model->newQuery();

        // Apply role filter
        $this->applyRoleFilter($query, $request);

        // Apply status filter
        $this->applyStatusFilter($query, $request);

        // Apply date range filters
        $this->applyDateRangeFilters($query, $request);

        // Apply phone verification filter
        $this->applyPhoneVerifiedFilter($query, $request);

        // Apply common filters
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        return $query->get();
    }

    /**
     * Helper: Apply role filter to query
     */
    protected function applyRoleFilter(Builder $query, Request $request): void
    {
        if ($request->has('role') && $request->role) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }
    }

    /**
     * Helper: Apply status filter
     */
    protected function applyStatusFilter(Builder $query, Request $request): void
    {
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
    }

    /**
     * Helper: Apply date range filters
     */
    protected function applyDateRangeFilters(Builder $query, Request $request): void
    {
        if ($request->has('created_from') && $request->created_from) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->has('created_to') && $request->created_to) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }
    }

    /**
     * Helper: Apply phone verified filter
     */
    protected function applyPhoneVerifiedFilter(Builder $query, Request $request): void
    {
        if ($request->has('phone_verified') && $request->phone_verified !== null) {
            if ($request->phone_verified) {
                $query->whereNotNull('phone_verified_at');
            } else {
                $query->whereNull('phone_verified_at');
            }
        }
    }
}
