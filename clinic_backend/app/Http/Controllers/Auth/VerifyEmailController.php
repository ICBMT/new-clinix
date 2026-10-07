<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * VerifyEmailController constructor
     */
    public function __construct()
    {
        // No repositories needed for this controller
    }

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            
            if ($user->hasVerifiedEmail()) {
                return redirect()->intended(route('dashboard.index', absolute: false).'?verified=1');
            }

            // Log email verification completion
            activity('email_verification')
                ->event('updated')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'verification_method' => 'email_link',
                    'status' => 'success',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->log("Email verification completed for user: {$user->name}");

            $request->fulfill();

            return redirect()->intended(route('dashboard.index', absolute: false).'?verified=1');
        });
    }
}
