<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * NewPasswordController constructor
     */
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}
    /**
     * Show the password reset page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        return $this->withTransaction(function () use ($request) {
            // Here we will attempt to reset the user's password. If it is successful we
            // will update the password on an actual user model and persist it to the
            // database. Otherwise we will parse the error and return the response.
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user) use ($request) {
                    // Use repository to update user password
                    $this->userRepository->update($user->id, [
                        'password' => $request->password,
                        'remember_token' => Str::random(60),
                    ]);

                    // Log successful password reset
                    activity('password_reset')
                        ->event('updated')
                        ->causedBy($user)
                        ->performedOn($user)
                        ->withProperties([
                            'user_id' => $user->id,
                            'email' => $user->email,
                            'name' => $user->name,
                            'reset_method' => 'email_link',
                            'ip_address' => request()->ip(),
                            'user_agent' => request()->userAgent(),
                        ])
                        ->log("Password reset completed for user: {$user->name}");

                    event(new PasswordReset($user));
                }
            );

            // Log the password reset attempt result
            if ($status == Password::PASSWORD_RESET) {
                return to_route('login')->with('status', __('common.password_reset_successful'));
            } else {
                activity('password_reset')
                    ->event('created')
                    ->withProperties([
                        'email' => $request->email,
                        'status' => 'failed',
                        'error_code' => $status,
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ])
                    ->log("Password reset failed for email: {$request->email}");
            }

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        });
    }
}
