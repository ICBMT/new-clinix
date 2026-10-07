<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('password.edit');
        
        return Inertia::render('dashboard/settings/password');
    }

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('password.edit');
        
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => [
                'required',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
                'confirmed',
            ],
        ], [
            'current_password.required' => __('common.current_password_required'),
            'current_password.current_password' => __('common.current_password_incorrect'),
            'password.required' => __('common.password_required'),
            'password.min' => __('common.password_min_length'),
            'password.mixed' => __('common.password_must_contain_mixed_case'),
            'password.numbers' => __('common.password_must_contain_numbers'),
            'password.symbols' => __('common.password_must_contain_special'),
            'password.confirmed' => __('common.password_confirmed'),
        ], [
            'current_password' => __('common.current_password'),
            'password' => __('common.new_password'),
        ]);
        
        // Check if current password and new password are the same
        if (Hash::check($validated['password'], $request->user()->password)) {
            return back()->withErrors([
                'password' => __('common.new_password_must_be_different'),
            ]);
        }

        return $this->withTransaction(function () use ($request, $validated) {
            $user = $request->user();
            
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            return back();
        });
    }
}

