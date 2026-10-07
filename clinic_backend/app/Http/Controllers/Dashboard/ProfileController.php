<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        Gate::authorize('profile.edit');
        
        return Inertia::render('dashboard/settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        Gate::authorize('profile.edit');
        
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $user->fill($request->validated());

            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            if ($user->isDirty('phone')) {
                $user->phone_verified_at = null;
            }

            $user->save();

            return to_route('dashboard.profile.edit');
        });
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('profile.destroy');
        
        $user = $request->user();
        
        // Prevent super admin from deleting their account
        if ($user->hasRole('super-admin')) {
            abort(403, __('common.cannot_delete_super_admin'));
        }
        
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        return $this->withTransaction(function () use ($request, $user) {
            Auth::logout();

            $user->delete();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/');
        });
    }
}

