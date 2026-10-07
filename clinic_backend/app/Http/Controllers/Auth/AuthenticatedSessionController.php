<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\DeviceToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    public function __construct()
    {
    }
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->validateCredentials();

            if (Features::enabled(Features::twoFactorAuthentication()) && $user->hasEnabledTwoFactorAuthentication()) {
                $request->session()->put([
                    'login.id' => $user->getKey(),
                    'login.remember' => $request->boolean('remember'),
                ]);

                activity('two_factor_auth')
                    ->event('created')
                    ->causedBy($user)
                    ->withProperties([
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'remember' => $request->boolean('remember'),
                        'login_method' => 'two_factor_challenge',
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ])
                    ->log("Two factor authentication challenge initiated for user: {$user->name}");

                return to_route('two-factor.login');
            }

            Auth::login($user, $request->boolean('remember'));

            $request->session()->regenerate();

            activity('login')
                ->event('created')
                ->causedBy($user)
                ->withProperties([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'remember' => $request->boolean('remember'),
                    'login_method' => 'standard',
                    'roles' => $user->getRoleNames()->toArray(),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->log("User logged in successfully: {$user->name}");

            return redirect()->intended(route('dashboard.index', absolute: false));
        });
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        return $this->withTransaction(function () use ($request) {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            
            if ($user && $user instanceof \App\Models\User) {
                try {
                    $deviceToken = $request->input('device_token');
                    
                    if ($deviceToken) {
                        $deleted = DeviceToken::deleteForUser($user, $deviceToken);
                        
                        Log::info(__('common.device_token_deleted_on_logout'), [
                            'user_id' => $user->id,
                            'device_token_preview' => substr($deviceToken, 0, 20) . '...',
                            'deleted' => $deleted,
                        ]);
                    } else {
                        Log::info(__('common.no_device_token_provided_on_logout'), [
                            'user_id' => $user->id,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error(__('common.failed_to_delete_device_token_on_logout'), [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
                
                activity('logout')
                    ->event('created')
                    ->causedBy($user)
                    ->withProperties([
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'logout_method' => 'manual',
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ])
                    ->log("User logged out: {$user->name}");
            }

            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/');
        });
    }
}
