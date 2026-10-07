<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UserAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => __('common.api_unauthenticated'),
            ], 401);
        }

        $user = Auth::user();

        // Check if user is active
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'is_active' => false,
                'message' => __('common.api_account_not_active'),
            ], 403);
        }

        // Check if user has verified phone
        if ($user->phone && !$user->phone_verified_at) {
            return response()->json([
                'success' => false,
                'is_phone_verified' => false,
                'message' => __('common.api_please_verify_phone'),
            ], 403);
        }

        return $next($request);
    }
}
