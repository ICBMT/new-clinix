<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class CheckAdminPanelAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        /** @var User $user */
        $user = Auth::user();
        $userRoles = $user->getRoleNames();

        // Super Admin: Always allow login, no restrictions
        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        // Deny access for guest and user roles
        if ($user->hasRole('guest') || $user->hasRole('user')) {
            // Log denied access attempt
            Log::warning('Admin panel access denied', [
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'roles' => $userRoles->toArray(),
                'reason' => 'guest_or_user_role',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'requested_url' => $request->fullUrl(),
            ]);

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->with('error', __('common.admin_panel_access_denied'));
        }

        // Check user status for Clinic / Clinic Manager / Staff roles
        if ($user->hasRole('clinic') || $user->hasRole('clinic_manager')) {
            // Check user status from users table
            if ($user->status === 'inactive') {
                Log::warning('Admin panel access denied - inactive user', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'status' => $user->status,
                    'roles' => $userRoles->toArray(),
                    'reason' => 'user_inactive',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'requested_url' => $request->fullUrl(),
                ]);

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return redirect()->route('login')->with('error', __('common.clinic_not_approved_yet'));
            }

            // For clinic role, only check if clinic status is inactive/suspended
            // Allow login even if clinic is pending, rejected, etc. - only block if inactive
            if ($user->hasRole('clinic')) {
                $clinic = $user->profile; // First owned clinic
                // Only block login if clinic status is 'suspended' or clinic doesn't exist
                // Allow login for pending, approved, rejected statuses
                if (!$clinic || $clinic->status === 'suspended') {
                    Log::warning('Admin panel access denied - clinic suspended or not found', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'clinic_id' => $clinic?->id,
                        'clinic_status' => $clinic?->status,
                        'reason' => 'clinic_suspended_or_not_found',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'requested_url' => $request->fullUrl(),
                    ]);

                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return redirect()->route('login')->with('error', __('common.account_inactive'));
                }
            }

            // For clinic_manager, check if they have at least one clinic assigned that is not suspended
            // Allow login even if clinics are pending/rejected - only block if all clinics are suspended
            if ($user->hasRole('clinic_manager')) {
                $assignedClinicIds = $user->getAssignedClinicIds();
                
                if (empty($assignedClinicIds)) {
                    // No clinics assigned at all
                    Log::warning('Admin panel access denied - clinic manager has no clinics assigned', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'reason' => 'no_clinics_assigned',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'requested_url' => $request->fullUrl(),
                    ]);

                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return redirect()->route('login')->with('error', __('common.account_inactive'));
                }
                
                // Check if all assigned clinics are suspended
                $activeClinics = \App\Models\Clinic::whereIn('id', $assignedClinicIds)
                    ->where('status', '!=', 'suspended')
                    ->count();
                
                if ($activeClinics === 0) {
                    Log::warning('Admin panel access denied - clinic manager has only suspended clinics', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'assigned_clinic_ids' => $assignedClinicIds,
                        'reason' => 'all_clinics_suspended',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'requested_url' => $request->fullUrl(),
                    ]);

                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return redirect()->route('login')->with('error', __('common.account_inactive'));
                }
            }
        }

        // Log successful access for other roles (super-admin, etc.)
        Log::info('Admin panel access granted - other roles', [
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'roles' => $userRoles->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'requested_url' => $request->fullUrl(),
        ]);

        // Allow all other roles (super-admin, etc.)
        return $next($request);
    }
}
