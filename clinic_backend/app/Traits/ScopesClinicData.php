<?php

namespace App\Traits;

use App\Contracts\ClinicRepositoryInterface;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;

trait ScopesClinicData
{
    /**
     * Get clinic repository instance
     */
    protected function getClinicRepository(): ClinicRepositoryInterface
    {
        return App::make(ClinicRepositoryInterface::class);
    }

    /**
     * Scope clinic query based on user role
     * - super-admin: can see all clinics
     * - clinic: can only see clinics where owner_id = user_id
     * - clinic_manager: can only see clinics where user is in clinic_users table
     */
    protected function scopeClinicsForUser(Builder $query, ?int $userId = null): Builder
    {
        $authUser = Auth::user();
        
        if (!$authUser || !($authUser instanceof User)) {
            return $query->whereRaw('1 = 0'); // No results if not authenticated
        }
        
        /** @var User $user */
        $user = $authUser;
        $userId = $userId ?? $user->id;
        
        // Super admin can see everything
        if ($user->hasRole('super-admin')) {
            return $query;
        }
        
        // Clinic role: only see approved clinics owned by this user
        if ($user->hasRole('clinic')) {
            $clinicIds = $user->getOwnedClinicIds();
            if (empty($clinicIds)) {
                return $query->whereRaw('1 = 0'); // No clinics owned
            }
            return $query->whereIn('id', $clinicIds);
        }
        
        // Clinic manager role: only see approved clinics where user is in clinic_users table
        if ($user->hasRole('clinic_manager')) {
            $clinicIds = $user->getAssignedClinicIds();
            if (empty($clinicIds)) {
                return $query->whereRaw('1 = 0'); // No clinics assigned
            }
            return $query->whereIn('id', $clinicIds);
        }
        
        // For other roles, return empty query (no access)
        return $query->whereRaw('1 = 0');
    }
    
    /**
     * Check if user can access a specific clinic
     */
    protected function canAccessClinic(int $clinicId, ?int $userId = null): bool
    {
        $authUser = Auth::user();
        
        if (!$authUser || !($authUser instanceof User)) {
            return false;
        }
        
        /** @var User $user */
        $user = $authUser;
        $userId = $userId ?? $user->id;
        
        // Use the User model's canAccessClinic method for consistency
        // This ensures the same logic is used everywhere
        if ($userId === $user->id) {
            return $user->canAccessClinic($clinicId);
        }
        
        // If checking for a different user, get that user and check
        $targetUser = User::find($userId);
        if (!$targetUser) {
            return false;
        }
        
        return $targetUser->canAccessClinic($clinicId);
    }
    
    /**
     * Get clinic IDs that the current user can access
     */
    protected function getAccessibleClinicIds(?int $userId = null): array
    {
        $authUser = Auth::user();
        
        if (!$authUser || !($authUser instanceof User)) {
            return [];
        }
        
        /** @var User $user */
        $user = $authUser;
        $userId = $userId ?? $user->id;
        
        $repository = $this->getClinicRepository();
        
        // Super admin can access all clinics
        if ($user->hasRole('super-admin')) {
            return $repository->getAllClinicIds();
        }
        
        // Clinic role: get approved clinics owned by this user
        if ($user->hasRole('clinic')) {
            return $user->getOwnedClinicIds();
        }
        
        // Clinic manager role: get approved clinics where user is assigned
        if ($user->hasRole('clinic_manager')) {
            return $user->getAssignedClinicIds();
        }
        
        return [];
    }

    /**
     * Get approved clinics for dropdowns based on user role
     * Only returns approved clinics
     */
    protected function getApprovedClinicsForDropdown(): \Illuminate\Database\Eloquent\Collection
    {
        $user = Auth::user();
        
        if (!$user || !($user instanceof User)) {
            return collect([]);
        }

        $query = \App\Models\Clinic::where('status', 'approved');

        // Super admin: All approved clinics
        if ($user->hasRole('super-admin')) {
            return $query->orderBy('name_en')->get(['id', 'name_en', 'name_ar']);
        }

        // Clinic owner: Only their approved clinics
        if ($user->hasRole('clinic')) {
            $clinicIds = $user->getOwnedClinicIds();
            if (empty($clinicIds)) {
                return collect([]);
            }
            return $query->whereIn('id', $clinicIds)
                ->orderBy('name_en')
                ->get(['id', 'name_en', 'name_ar']);
        }

        // Clinic manager: Only assigned approved clinics
        if ($user->hasRole('clinic_manager')) {
            $clinicIds = $user->getAssignedClinicIds();
            if (empty($clinicIds)) {
                return collect([]);
            }
            return $query->whereIn('id', $clinicIds)
                ->orderBy('name_en')
                ->get(['id', 'name_en', 'name_ar']);
        }

        return collect([]);
    }

    /**
     * Get approved clinic owners for dropdowns
     * Only returns users who own approved clinics
     * Requirements:
     * - Must have 'clinic' role
     * - Must have status 'active' in users table
     * - Must own at least one clinic with status 'approved' in clinics table
     * 
     * Role-based filtering:
     * - Clinic role: Only show the logged-in user themselves
     * - Clinic manager: Only show owners of clinics they manage
     * - All other roles: Show all clinic role users
     */
    protected function getApprovedClinicOwnersForDropdown(): \Illuminate\Database\Eloquent\Collection
    {
        $user = Auth::user();
        
        if (!$user || !($user instanceof User)) {
            return collect([]);
        }

        // Build base query: users with 'clinic' role, active status, and owning approved clinics
        $query = User::query()
            ->where('status', 'active')
            ->whereHas('roles', function ($q) {
                $q->where('name', 'clinic');
            })
            ->whereHas('ownedClinics', function ($q) {
                $q->where('status', 'approved');
            });

        // Clinic role: Only show the logged-in user themselves (no other users)
        if ($user->hasRole('clinic') && !$user->hasRole('super-admin')) {
            return $query->where('id', $user->id)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone']);
        }

        // Clinic manager: Only show owners of clinics they manage
        if ($user->hasRole('clinic_manager') && !$user->hasRole('super-admin')) {
            $clinicIds = $user->getAssignedClinicIds();
            if (empty($clinicIds)) {
                return collect([]);
            }
            return $query->whereHas('ownedClinics', function ($q) use ($clinicIds) {
                $q->whereIn('id', $clinicIds)
                  ->where('status', 'approved');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);
        }

        // All other roles (super-admin, etc.): Show all clinic role users
        return $query->orderBy('name')->get(['id', 'name', 'email', 'phone']);
    }
}

