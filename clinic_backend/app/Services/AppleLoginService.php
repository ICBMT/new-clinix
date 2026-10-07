<?php

namespace App\Services;

use App\Models\User;
use App\Contracts\UserRepositoryInterface;
use App\Models\DeviceToken;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AppleLoginService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    /**
     * Complete Apple API login flow
     */
    public function loginWithAppleToken(string $token, string $role = 'user', ?string $deviceToken = null, ?string $deviceType = null): array
    {
        try {
            // Step 1: Verify Apple token (simple JWT decode)
            $appleData = $this->verifyAppleToken($token);
            
            if (!$appleData) {
                return [
                    'success' => false,
                    'message' => __('common.api.auth.apple.token_invalid'),
                    'error' => __('common.api.auth.apple.token_verification_failed')
                ];
            }

            // Step 2: Find or create user using repository
            $user = $this->findOrCreateUser($appleData, $role);
            
            if (!$user) {
                return [
                    'success' => false,
                    'message' => __('common.api.auth.apple.user_creation_failed'),
                    'error' => __('common.api.auth.apple.user_creation_error')
                ];
            }

            // Step 3: Handle device token if provided
            if ($deviceToken && $deviceType) {
                $this->handleDeviceToken($user, $deviceToken, $deviceType);
            }

            return [
                'success' => true,
                'user' => $user,
                'message' => __('common.api.auth.apple.login_successful'),
                'access_token' => $user->createToken('apple-login')->plainTextToken
            ];
        } catch (\Exception $e) {
            Log::error('Apple API login failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => __('common.api.auth.apple.login_failed'),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify Apple token (simple JWT decode for testing)
     */
    private function verifyAppleToken(string $token): ?array
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) return null;
            
            $payload = json_decode(base64_decode($parts[1]), true);
            if (!$payload) return null;

            // Basic validation
            if (empty($payload['sub'])) return null;

            return [
                'sub' => $payload['sub'],
                'email' => $payload['email'] ?? null,
                'name' => $payload['name'] ?? __('common.api.auth.apple.default_user_name'),
                'email_verified' => $payload['email_verified'] ?? false,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to decode Apple token: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Find or create user from Apple login using repository
     */
    private function findOrCreateUser(array $appleData, string $role = 'user'): ?User
    {
        try {
            // First, try to find user by Apple social ID
            $user = $this->userRepository->findBy([
                'social_id' => $appleData['sub'],
                'social_type' => 'apple'
            ]);

            if (!$user && $appleData['email']) {
                // If not found by Apple ID, try to find by email
                $user = $this->userRepository->findBy(['email' => $appleData['email']]);
            }

            if (!$user) {
                // Create new user using repository
                $userData = [
                    'name' => $appleData['name'] ?? __('common.api.auth.apple.default_user_name'),
                    'email' => $appleData['email'] ?? null,
                    'social_id' => $appleData['sub'],
                    'social_type' => 'apple',
                    'password' => Hash::make(Str::random(24)),
                    'email_verified_at' => $appleData['email_verified'] ? now() : null,
                    'default_language' => 'en',
                ];
                
                $user = $this->userRepository->create($userData);
                $user->assignRole($role);
            }

            // Update last login
            $user->update(['last_login_at' => now()]);

            return $user;
        } catch (\Exception $e) {
            Log::error('Failed to find or create Apple user: ' . $e->getMessage());
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
}
