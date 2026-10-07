<?php

namespace App\Http\Middleware;

use App\Models\MaintenanceMode;
use Inertia\Inertia;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnforceMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * Allow bypass for configured roles while maintenance is enabled.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $mode = MaintenanceMode::query()->latest('id')->first();
        } catch (\Exception $e) {
            // If table doesn't exist (e.g., during tests), skip maintenance check
            return $next($request);
        }

        if ($mode && $mode->is_enabled) {
            // Allow authenticated users with allowed roles
            if (Auth::check()) {
                $user = Auth::user();
                $allowed = collect((array) ($mode->target_roles ?? []));
                if ($allowed->isEmpty() || $user->roles()->whereIn('name', $allowed)->exists()) {
                    return $next($request);
                }
            }

            // For API, return JSON 503; for web, show view
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => $mode->title_en,
                    'title' => $mode->title_en,
                    'details' => $mode->body_en,
                ], 503);
            }

            $response = Inertia::render('maintenance', [
                'title_en' => $mode->title_en,
                'title_ar' => $mode->title_ar,
                'body_en' => $mode->body_en,
                'body_ar' => $mode->body_ar,
            ])->toResponse($request);

            return $response->setStatusCode(503);
        }

        return $next($request);
    }
}
