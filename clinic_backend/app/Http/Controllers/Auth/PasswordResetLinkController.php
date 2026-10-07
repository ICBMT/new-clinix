<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * PasswordResetLinkController constructor
     */
    public function __construct()
    {
        // No repositories needed for this controller
    }
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => __('common.auth_email_required'),
            'email.email' => __('common.auth_email_invalid'),
        ]);

        return $this->withTransaction(function () use ($request) {
            // Log password reset request
            activity('password_reset')
                ->event('created')
                ->withProperties([
                    'email' => $request->email,
                    'request_method' => 'web_form',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->log("Password reset link requested for email: {$request->email}");

            $status = Password::sendResetLink(
                $request->only('email')
            );

            // Log the result of the password reset request
            if ($status === Password::RESET_LINK_SENT) {
                activity('password_reset')
                    ->event('updated')
                    ->withProperties([
                        'email' => $request->email,
                        'status' => 'success',
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ])
                    ->log("Password reset link sent successfully to email: {$request->email}");
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
                    ->log("Password reset link failed for email: {$request->email}");
            }

            // Always return success message for security (don't reveal if email exists)
            return back()->with('status', __('common.password_reset_link_sent'));
        });
    }
}
