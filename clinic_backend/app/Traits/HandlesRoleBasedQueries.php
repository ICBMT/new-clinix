<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait HandlesRoleBasedQueries
{
    /**
     * Apply role-based clinic filtering to a query
     * 
     * @param Builder $query
     * @param string $clinicIdColumn Column name for clinic_id (default: 'clinic_id')
     * @return Builder
     */
    protected function applyRoleBasedClinicFilter(Builder $query, string $clinicIdColumn = 'clinic_id'): Builder
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        
        if (!$user || !($user instanceof \App\Models\User)) {
            // If no user, return empty query
            return $query->whereRaw('1 = 0');
        }

        // Super Admin: No filtering, show all data
        if ($user->hasRole('super-admin')) {
            return $query;
        }

        // Clinic Owner: Show only their owned clinics
        if ($user->hasRole('clinic')) {
            $clinicIds = $user->getOwnedClinicIds();
            if (empty($clinicIds)) {
                return $query->whereRaw('1 = 0'); // No clinics owned
            }
            return $query->whereIn($clinicIdColumn, $clinicIds);
        }

        // Clinic Manager: Show only assigned clinics
        if ($user->hasRole('clinic_manager')) {
            $clinicIds = $user->getAssignedClinicIds();
            if (empty($clinicIds)) {
                return $query->whereRaw('1 = 0'); // No clinics assigned
            }
            return $query->whereIn($clinicIdColumn, $clinicIds);
        }

        // Default: No access
        return $query->whereRaw('1 = 0');
    }

    /**
     * Get approved clinic IDs based on user role
     * 
     * @return array Array of clinic IDs, empty array means all clinics (super admin)
     */
    protected function getApprovedClinicIdsForDropdown(): array
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        
        if (!$user || !($user instanceof \App\Models\User)) {
            return [];
        }

        // Super Admin: Can see all approved clinics
        if ($user->hasRole('super-admin')) {
            return \App\Models\Clinic::where('status', 'approved')
                ->pluck('id')
                ->toArray();
        }

        // Clinic Owner: Only their approved clinics
        if ($user->hasRole('clinic')) {
            return \App\Models\Clinic::where('owner_id', $user->id)
                ->where('status', 'approved')
                ->pluck('id')
                ->toArray();
        }

        // Clinic Manager: Only assigned approved clinics
        if ($user->hasRole('clinic_manager')) {
            return \App\Models\Clinic::whereIn('id', $user->getAssignedClinicIds())
                ->where('status', 'approved')
                ->pluck('id')
                ->toArray();
        }

        return [];
    }

    /**
     * Get approved clinics query for dropdowns
     * 
     * @return Builder
     */
    protected function getApprovedClinicsQuery(): Builder
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        $query = \App\Models\Clinic::where('status', 'approved');

        if (!$user || !($user instanceof \App\Models\User)) {
            return $query->whereRaw('1 = 0');
        }

        // Super Admin: All approved clinics
        if ($user->hasRole('super-admin')) {
            return $query;
        }

        // Clinic Owner: Only their approved clinics
        if ($user->hasRole('clinic')) {
            return $query->where('owner_id', $user->id);
        }

        // Clinic Manager: Only assigned approved clinics
        if ($user->hasRole('clinic_manager')) {
            $clinicIds = $user->getAssignedClinicIds();
            if (empty($clinicIds)) {
                return $query->whereRaw('1 = 0');
            }
            return $query->whereIn('id', $clinicIds);
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * Check if current user can approve/reject clinics
     * Checks for clinics.approve and clinics.reject permissions
     * 
     * @return bool
     */
    protected function canApproveRejectClinics(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !($user instanceof \App\Models\User)) {
            return false;
        }
        
        // Check if user has either approve or reject permission
        return $user->can('clinics.approve') || $user->can('clinics.reject');
    }
}

