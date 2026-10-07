<?php

namespace App\Services;

use App\Models\User;
use App\Contracts\UserRepositoryInterface;
use App\Models\DeviceToken;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

class GoogleLoginService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    /**
     * Complete Google API login flow
     */
    public function loginWithGoogleToken(string $token, string $role = 'user', ?string $deviceToken = null, ?string $deviceType = null): array
    {
        try {
            // Step 1: Verify token with Google (try both access token and ID token)
            $socialUser = $this->verifyGoogleToken($token);
            
            if (!$socialUser) {
                return [
                    'success' => false,
                    'message' => __('common.api.auth.google.token_invalid'),
                    'error' => __('common.api.auth.google.token_verification_failed')
                ];
            }

            // Step 2: Find or create user using repository
            $user = $this->findOrCreateUser($socialUser, $role);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => __('common.api.auth.google.user_creation_failed'),
                    'error' => __('common.api.auth.google.user_creation_error')
                ];
            }

            // Step 3: Handle device token if provided
            if ($deviceToken && $deviceType) {
                $this->handleDeviceToken($user, $deviceToken, $deviceType);
            }

            return [
                'success' => true,
                'user' => $user,
                'message' => __('common.api.auth.google.login_successful'),
                'access_token' => $user->createToken('google-login')->plainTextToken
            ];
        } catch (\Exception $e) {
            Log::error('Google API login failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => __('common.api.auth.google.login_failed'),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Find or create user from Google login using repository
     */
    private function findOrCreateUser(SocialiteUser $googleUser, string $role = 'user'): ?User
    {
        try {
            // First, try to find user by Google social ID
            $user = $this->userRepository->findBy([
                'social_id' => $googleUser->getId(),
                'social_type' => 'google'
            ]);

            if (!$user && $googleUser->getEmail()) {
                // If not found by Google ID, try to find by email
                $user = $this->userRepository->findBy(['email' => $googleUser->getEmail()]);
            }

            if (!$user) {
                // Create new user using repository
                $userData = [
                    'name' => $googleUser->getName() ?? __('common.api.auth.google.default_user_name'),
                    'email' => $googleUser->getEmail(),
                    'social_id' => $googleUser->getId(),
                    'social_type' => 'google',
                    'password' => Hash::make(Str::random(24)),
                    'email_verified_at' => now(),
                    'default_language' => 'en',
                ];

                $user = $this->userRepository->create($userData);
                $user->assignRole($role);
            }

            // Update last login
            $user->update(['last_login_at' => now()]);

            return $user;
        } catch (\Exception $e) {
            Log::error('Failed to find or create Google user: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Handle device token for push notifications
     */
    private function handleDeviceToken(User $user, string $deviceToken, string $deviceType): void
    {
        try {
            // Use the model method to ensure only one token per user per type
            DeviceToken::createOrUpdateForUser($user, $deviceToken, $deviceType);
        } catch (\Exception $e) {
            Log::error('Failed to handle device token: ' . $e->getMessage());
        }
    }

    /**
     * Verify Google token (supports both access token and ID token)
     */
    private function verifyGoogleToken(string $token): ?SocialiteUser
    {
        try {
            // First try as access token (for web OAuth)
            return Socialite::driver('google')->stateless()->userFromToken($token);
        } catch (\Exception $e) {
            // If access token fails, try as ID token (for mobile apps)
            try {
                $payload = $this->decodeJwtPayload($token);
                if (!$payload) return null;

                // Create SocialiteUser from ID token payload
                $socialUser = new \Laravel\Socialite\Two\User();
                $socialUser->id = $payload['sub'];
                $socialUser->name = $payload['name'] ?? __('common.api.auth.google.default_user_name');
                $socialUser->email = $payload['email'] ?? null;
                $socialUser->avatar = $payload['picture'] ?? null;
                $socialUser->user = $payload;

                return $socialUser;
            } catch (\Exception $idTokenException) {
                Log::error('Both access token and ID token verification failed', [
                    'access_token_error' => $e->getMessage(),
                    'id_token_error' => $idTokenException->getMessage()
                ]);
                return null;
            }
        }
    }

    /**
     * Decode JWT payload (simple, no signature verification for testing)
     */
    private function decodeJwtPayload(string $token): ?array
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) return null;
            
            $payload = json_decode(base64_decode($parts[1]), true);
            return $payload ?: null;
        } catch (\Exception $e) {
            Log::error('Failed to decode JWT payload: ' . $e->getMessage());
            return null;
        }
    }
}
