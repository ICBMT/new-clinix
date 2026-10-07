<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RestrictSuperAdminEdit
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        // Only apply to authenticated users
        if (!$user) {
            return $next($request);
        }

        // Check if current user is super-admin
        if ($user->hasRole('super-admin')) {
            // Get the target user ID from route parameters
            $targetUserId = $request->route('user') ?? $request->route('id') ?? $request->route('clinic') ?? $request->route('admin');
            
            // Only block if we're trying to access a specific super admin profile
            if ($targetUserId) {
                $targetUser = \App\Models\User::find($targetUserId);
                
                if ($targetUser && $targetUser->hasRole('super-admin')) {
                    // Block specific actions for users management if the target is a super-admin
                    if ($request->routeIs('dashboard.users.show') ||
                        $request->routeIs('dashboard.users.edit') ||
                        $request->routeIs('dashboard.users.update') ||
                        $request->routeIs('dashboard.users.destroy') ||
                        $request->routeIs('dashboard.users.toggle-email-verification') ||
                        $request->routeIs('dashboard.users.toggle-phone-verification') ||
                        $request->routeIs('dashboard.users.toggle-status')) {
                        return redirect()->route('dashboard.users.index')
                            ->with('error', __('common.super_admin_cannot_manage_users'));
                    }
                    
                    // Block specific actions for clinics management if the target is a super-admin
                    if ($request->routeIs('dashboard.clinics.show') ||
                        $request->routeIs('dashboard.clinics.edit') ||
                        $request->routeIs('dashboard.clinics.update') ||
                        $request->routeIs('dashboard.clinics.destroy') ||
                        $request->routeIs('dashboard.clinics.approve') ||
                        $request->routeIs('dashboard.clinics.reject') ||
                        $request->routeIs('dashboard.clinics.toggle-email-verification') ||
                        $request->routeIs('dashboard.clinics.toggle-phone-verification') ||
                        $request->routeIs('dashboard.clinics.toggle-status')) {
                        return redirect()->route('dashboard.clinics.index')
                            ->with('error', __('common.super_admin_cannot_manage_clinics'));
                    }
                    
                    // Block specific actions for admins management if the target is a super-admin
                    if ($request->routeIs('dashboard.admins.show') ||
                        $request->routeIs('dashboard.admins.edit') ||
                        $request->routeIs('dashboard.admins.update') ||
                        $request->routeIs('dashboard.admins.destroy') ||
                        $request->routeIs('dashboard.admins.toggle-email-verification') ||
                        $request->routeIs('dashboard.admins.toggle-phone-verification') ||
                        $request->routeIs('dashboard.admins.toggle-status')) {
                        return redirect()->route('dashboard.admins.index')
                            ->with('error', __('common.super_admin_cannot_manage_admins'));
                    }
                }
            }
        }

        return $next($request);
    }
}
