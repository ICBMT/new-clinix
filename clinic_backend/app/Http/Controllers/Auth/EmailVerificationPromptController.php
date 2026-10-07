<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * EmailVerificationPromptController constructor
     */
    public function __construct()
    {
        // No repositories needed for this controller
    }

    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        
        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard.index', absolute: false));
        }

        // Log email verification prompt viewed
        activity('email_verification')
            ->event('created')
            ->causedBy($user)
            ->withProperties([
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'status' => 'prompt_displayed',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log("Email verification prompt viewed for user: {$user->name}");

        return Inertia::render('auth/verify-email', ['status' => $request->session()->get('status')]);
    }
}
