<?php

namespace App\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * UserRepositoryInterface
 * 
 * User-specific repository contract
 * Extends BaseRepositoryInterface and adds user-specific methods
 */
interface UserRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get users by role
     */
    public function getByRole(string $roleName): Collection;

    /**
     * Get users by verification status
     */
    public function getByVerificationStatus(string $status): Collection;

    /**
     * Get verified vendors
     */
    public function getVerifiedVendors(): Collection;

    /**
     * Get pending vendors
     */
    public function getPendingVendors(): Collection;

    /**
     * Get rejected vendors
     */
    public function getRejectedVendors(): Collection;

    /**
     * Get users by role with pagination
     */
    public function getByRolePaginated(string $roleName, Request $request, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get admin users with pagination (excluding super-admin, vendor, guest)
     */
    public function getAdminUsersPaginated(Request $request, int $perPage = 15): LengthAwarePaginator;

    /**
     * Update user verification status
     */
    public function updateVerificationStatus(int $id, string $status, string $rejectionReason = null): User;

    /**
     * Approve vendor
     */
    public function approveVendor(int $id): User;

    /**
     * Reject vendor
     */
    public function rejectVendor(int $id, string $reason): User;

    /**
     * Get users with recent activity
     */
    public function getRecentActivity(int $days = 7): Collection;

    /**
     * Get role statistics
     */
    public function getRoleStatistics(): array;

    /**
     * Get verification statistics
     */
    public function getVerificationStatistics(): array;

    /**
     * Get dashboard statistics
     */
    public function getDashboardStatistics(): array;

    /**
     * Advanced search with multiple criteria
     */
    public function advancedSearch(Request $request): Collection;
}
