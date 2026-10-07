<?php

use App\Exceptions\ApiExceptionHandler;
use App\Http\Middleware\CheckAdminPanelAccess;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RestrictSuperAdminEdit;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\SetUserLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        if (method_exists($middleware, 'api')) {
            $middleware->api(append: [
                SetUserLocale::class,
            ]);
        }

        $middleware->alias([
            'check-admin-panel-access' => CheckAdminPanelAccess::class,
            'restrict.super.admin.edit' => RestrictSuperAdminEdit::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle AuthenticationException for web requests - redirect to login
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            // For API requests, let ApiExceptionHandler handle it
            if ($request->expectsJson() || $request->is('api/*')) {
                return null; // Let ApiExceptionHandler handle it
            }
            
            // For web requests (dashboard/admin panel), redirect to login
            return redirect()->route('login')->with('error', __('common.session_expired_please_login'));
        });

        // Handle session database errors gracefully
        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            // Check if it's a sessions table error
            if (str_contains($e->getMessage(), "Table '") && str_contains($e->getMessage(), ".sessions' doesn't exist")) {
                // For API requests, return JSON error
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => __('common.session_error'),
                    ], 500);
                }
                
                // For web requests, try to redirect to login if authenticated, otherwise show error
                try {
                    if (!\Illuminate\Support\Facades\Auth::check()) {
                        return redirect()->route('login')->with('error', __('common.session_error'));
                    }
                } catch (\Exception $authException) {
                    // If auth check fails, redirect to login
                    return redirect()->route('login')->with('error', __('common.session_error'));
                }
            }
            
            return null; // Let other handlers process it
        });

        // Return JSON for all API route exceptions
        $exceptions->renderable([ApiExceptionHandler::class, 'render']);

        // Report exceptions via email
        $exceptions->reportable([ApiExceptionHandler::class, 'report']);
    })->create();
