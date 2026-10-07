<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * EmailVerificationNotificationController constructor
     */
    public function __construct()
    {
        // No repositories needed for this controller
    }

    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            
            if ($user->hasVerifiedEmail()) {
                return redirect()->intended(route('dashboard.index', absolute: false));
            }

            // Log email verification request
            activity('email_verification')
                ->event('created')
                ->causedBy($user)
                ->withProperties([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'request_method' => 'manual_request',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->log("Email verification requested for user: {$user->name}");

            $user->sendEmailVerificationNotification();

            // Log email verification sent
            activity('email_verification')
                ->event('updated')
                ->causedBy($user)
                ->withProperties([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'status' => 'success',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ])
                ->log("Email verification sent for user: {$user->name}");

            return back()->with('status', __('common.verification_link_sent'));
        });
    }
}
