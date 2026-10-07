<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\VerifyOtpRequest;
use App\Http\Requests\Api\V1\Auth\ResendOtpRequest;
use App\Http\Requests\Api\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Http\Requests\Api\V1\Auth\ChangePasswordRequest;

use App\Http\Resources\Api\V1\Auth\TokenResource;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Contracts\UserRepositoryInterface;
use App\Models\PasswordResetToken;
use App\Models\DeviceToken;
use App\Services\Api\V1\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly OtpService $otpService
    ) {}

    /**
     * Login user with phone and password
     */
    public function login(LoginRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $credentials = $request->validated();

            // Login with phone and password only
            $loginCredentials = [
                'phone' => $credentials['phone'],
                'password' => $credentials['password']
            ];

            if (!Auth::attempt($loginCredentials)) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_invalid_credentials'),
                    'errors' => ['phone' => [__('common.api_invalid_credentials')]]
                ], 401);
            }

            $user = Auth::user();

            // Check if user account status is inactive
            if ($user->status === 'inactive') {
                Auth::logout();

                return response()->json([
                    'success' => false,
                    'message' => __('common.api_account_not_active'),
                    'errors' => ['status' => [__('common.api_account_not_active')]]
                ], 403);
            }

            // Check if user role is allowed to login via API
            if (!$this->isRoleAllowedForApiLogin($user)) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_login_role_restricted'),
                    'errors' => ['role' => [__('common.api_login_role_restricted')]]
                ], 403);
            }

            // Handle device token using validated credentials
            $deviceType = $credentials['device_type'] ?? 'fcm';
            $this->handleDeviceToken('login', $user, $credentials['device_token'] ?? null, $deviceType);

            // Update last login using repository
            $this->userRepository->update($user->id, ['last_login_at' => now()]);
            $user->refresh();

            // Create API token
            $token = $user->createToken('api-login')->plainTextToken;

            // Log successful login
            $this->logActivity(
                'api_auth',
                "API login successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                    'login_method' => 'phone_password',
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_login_successful'),
                'data' => [
                    'user' => new UserResource($user),
                    'token' => new TokenResource((object)['token' => $token, 'type' => 'Bearer']),
                ]
            ]);
        });
    }

    /**
     * Register user with OTP verification
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            // Create user
            $user = $this->userRepository->create($data);

            // Assign user role
            $user->assignRole('user');

            // Generate and send OTP
            $otpSent = $this->otpService->generateOtp($user->phone);

            if (!$otpSent) {
                Log::error('Failed to send OTP during registration', [
                    'user_id' => $user->id,
                    'phone' => $user->phone
                ]);

                return response()->json([
                    'success' => false,
                    'message' => __('common.api_registration_otp_failed'),
                    'data' => [
                        'user' => new UserResource($user),
                        'otp_sent' => false,
                    ]
                ], 201);
            }

            return response()->json([
                'success' => true,
                'message' => __('common.api_registration_successful_verify_otp'),
                'data' => [
                    'user' => new UserResource($user),
                    'otp_sent' => true,
                    'phone' => $user->phone,
                ]
            ], 201);
        });
    }

    /**
     * Verify OTP for phone number and return token
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            $verified = $this->otpService->verifyOtp($data['phone'], $data['otp']);

            if (!$verified) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_otp_invalid'),
                    'errors' => ['otp' => [__('common.api_otp_invalid')]]
                ], 422);
            }

            // Find user by phone and mark phone as verified using repository
            $user = $this->userRepository->findBy(['phone' => $data['phone']]);

            if ($user) {
                $this->userRepository->update($user->id, ['phone_verified_at' => now()]);
                $user->refresh();

                // Create API token
                $token = $user->createToken('api-otp-verification')->plainTextToken;

                // Log OTP verification
                $this->logActivity(
                    'api_auth',
                    "API OTP verification successful for user: {$user->name}",
                    [
                        'user_id' => $user->id,
                        'phone' => $user->phone,
                    ],
                    $user
                );

                return response()->json([
                    'success' => true,
                    'message' => __('common.api_otp_verification_successful'),
                    'data' => [
                        'user' => new UserResource($user),
                        'token' => new TokenResource((object)['token' => $token, 'type' => 'Bearer']),
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => __('common.api_user_not_found'),
                'errors' => ['phone' => [__('common.api_user_not_found')]]
            ], 404);
        });
    }

    /**
     * Resend OTP to phone number
     */
    public function resendOtp(ResendOtpRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            $otpSent = $this->otpService->generateOtp($data['phone']);

            if (!$otpSent) {
                Log::error('Failed to resend OTP', [
                    'phone' => $data['phone']
                ]);

                return response()->json([
                    'success' => false,
                    'message' => __('common.api_otp_resend_failed'),
                    'errors' => ['phone' => [__('common.api_otp_resend_failed')]]
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => __('common.api_otp_resend_successful'),
                'data' => [
                    'phone' => $data['phone'],
                    'otp_sent' => true,
                ]
            ]);
        });
    }

    /**
     * Send password reset token to phone number
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            $user = $this->userRepository->findBy(['phone' => $data['phone']]);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_user_not_found'),
                    'errors' => ['phone' => [__('common.api_user_not_found')]]
                ], 404);
            }

            // Send OTP for verification (not the token)
            $otpSent = $this->otpService->generateOtp($data['phone']);

            if (!$otpSent) {
                Log::error('Failed to send OTP for password reset', [
                    'phone' => $data['phone'],
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => __('common.api_forgot_password_failed'),
                    'errors' => ['phone' => [__('common.api_otp_resend_failed')]]
                ], 500);
            }

            // Log password reset request
            $this->logActivity(
                'api_auth',
                "Password reset OTP sent to user: {$user->name}",
                [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_forgot_password_successful'),
                'data' => [
                    'phone' => $data['phone'],
                    'otp_sent' => true,
                ]
            ]);
        });
    }

    /**
     * Send password reset token to phone number
     */
    public function verifyResetOtp(VerifyOtpRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            $verified = $this->otpService->verifyOtp($data['phone'], $data['otp']);

            if (!$verified) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_otp_invalid'),
                    'errors' => ['otp' => [__('common.api_otp_invalid')]]
                ], 422);
            }

            // Find user by phone and mark phone as verified using repository
            $user = $this->userRepository->findBy(['phone' => $data['phone']]);

            if ($user) {
                $this->userRepository->update($user->id, ['phone_verified_at' => now()]);
                $user->refresh();

                // Generate password reset token (hidden from user)
                $token = Str::random(64);

                // Store token using model relationship with 1 hour expiration
                PasswordResetToken::createForPhone($data['phone'], Hash::make($token), 60);


                // Log password reset token creation
                $this->logActivity(
                    'api_auth',
                    "API password reset token created for user: {$user->name}",
                    [
                        'user_id' => $user->id,
                        'phone' => $user->phone,
                    ],
                    $user
                );

                return response()->json([
                    'success' => true,
                    'message' => __('common.api_password_reset_token_created'),
                    'data' => [
                        'user' => new UserResource($user),
                        'security_token' => $token,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => __('common.api_user_not_found'),
                'errors' => ['phone' => [__('common.api_user_not_found')]]
            ], 404);
        });
    }

    /**
     * Reset password with token verification
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            // Find password reset token using model
            $resetRecord = PasswordResetToken::findValidForPhone($data['phone']);

            if (!$resetRecord || !Hash::check($data['security_token'], $resetRecord->token)) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_reset_token_invalid'),
                    'errors' => ['token' => [__('common.api_reset_token_invalid')]]
                ], 422);
            }

            // Find user and update password
            $user = $this->userRepository->findBy(['phone' => $data['phone']]);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.api_user_not_found'),
                    'errors' => ['phone' => [__('common.api_user_not_found')]]
                ], 404);
            }

            // Update password using repository
            $this->userRepository->update($user->id, ['password' => $data['password']]);
            $user->refresh();

            // Delete used token using model
            PasswordResetToken::deleteForPhone($data['phone']);

            // Log password reset
            $this->logActivity(
                'api_auth',
                "API password reset successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_reset_password_successful'),
                'data' => [
                    'user' => new UserResource($user),
                ]
            ]);
        });
    }

    /**
     * Change password for authenticated user
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $user = $request->user();

            // Refresh user model to ensure we have the latest password from database
            $user->refresh();

            // Verify current password before updating
            if (!Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.validation_failed'),
                    'errors' => [
                        'current_password' => [__('common.auth_current_password_incorrect')]
                    ]
                ], 422);
            }

            // Update password using repository
            $this->userRepository->update($user->id, ['password' => $data['password']]);
            $user->refresh();

            // Revoke all existing tokens
            $user->tokens()->delete();

            // Create new token
            $token = $user->createToken('api-password-change')->plainTextToken;

            // Log password change
            $this->logActivity(
                'api_auth',
                "API password change successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_change_password_successful'),
                'data' => [
                    'user' => new UserResource($user),
                    'token' => new TokenResource((object)['token' => $token, 'type' => 'Bearer']),
                ]
            ]);
        });
    }

    /**
     * Handle device token operations (logout/delete)
     */
    private function handleDeviceToken(string $operation, $user, ?string $deviceToken = null, ?string $deviceType = null): void
    {
        if ($deviceToken) {
            try {
                switch ($operation) {
                    case 'logout':
                        // Delete device token on logout
                        DeviceToken::deleteForUser($user, $deviceToken);
                        Log::info("Device token deleted for logout", [
                            'user_id' => $user->id,
                            'device_token' => $deviceToken,
                            'operation' => $operation,
                        ]);
                        break;

                    case 'delete':
                        // Delete device token on account deletion
                        DeviceToken::deleteForUser($user, $deviceToken);
                        Log::info("Device token deleted for account deletion", [
                            'user_id' => $user->id,
                            'device_token' => $deviceToken,
                            'operation' => $operation,
                        ]);
                        break;

                    case 'login':
                        // Create or update device token on login
                        if ($deviceType) {
                            DeviceToken::createOrUpdateForUser($user, $deviceToken, $deviceType);
                            Log::info("Device token created/updated for login", [
                                'user_id' => $user->id,
                                'device_token' => $deviceToken,
                                'device_type' => $deviceType,
                                'operation' => $operation,
                            ]);
                        }
                        break;
                }
            } catch (\Exception $e) {
                Log::error("Failed to handle device token {$operation}", [
                    'user_id' => $user->id,
                    'device_token' => $deviceToken,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();

            $deviceToken = $request->input('device_token');

            // Handle device token logout
            $this->handleDeviceToken('logout', $user, $deviceToken);

            // Revoke current token
            // Get the token from the request bearer token
            $token = $request->user()->currentAccessToken();
            if ($token && get_class($token) !== 'Laravel\Sanctum\TransientToken') {
                $token->delete();
            } else {
                // If using bearer token, delete by token string
                $bearerToken = $request->bearerToken();
                if ($bearerToken) {
                    // Delete token by finding it
                    $request->user()->tokens()->where('token', hash('sha256', explode('|', $bearerToken)[1] ?? ''))->delete();
                } else {
                    // Fallback: delete all tokens for the user
                    $request->user()->tokens()->delete();
                }
            }

            // Log logout
            $this->logActivity(
                'api_auth',
                "API logout successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                    'device_token' => $deviceToken,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_logout_successful'),
            ]);
        });
    }

    /**
     * Logout user from all devices
     */
    public function logoutAllDevices(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();

            // Delete all device tokens for the user
            DeviceToken::deleteForUser($user);

            // Revoke all tokens
            $user->tokens()->delete();

            // Log logout all devices
            $this->logActivity(
                'api_auth',
                "API logout all devices successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_logout_all_devices_successful'),
            ]);
        });
    }

    /**
     * Refresh access token
     */
    public function me(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();

            // Log token refresh
            $this->logActivity(
                'user_info',
                "User info fetched successfully for user: {$user->name}",
                [
                    'user_id' => $user->id,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.user_info_fetched_successfully'),
                'data' => [
                    'user' => new UserResource($user),
                ]
            ]);
        });
    }

    /**
     * Delete user account
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $deviceToken = $request->input('device_token');

            // Handle device token deletion
            $this->handleDeviceToken('delete', $user, $deviceToken);

            // Delete all device tokens for the user
            DeviceToken::deleteForUser($user);

            // Revoke all tokens (using Laravel Sanctum relationship - acceptable)
            $user->tokens()->delete();

            // Delete user account using repository
            $this->userRepository->delete($user->id);

            return response()->json([
                'success' => true,
                'message' => __('common.api_account_deleted_successful'),
            ]);
        });
    }

    /**
     * Guest login - create temporary guest user
     */
    public function guestLogin(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            // Create guest user
            $guestUserData = [
                'name' => __('common.guest_user_default_name') . ' ' . uniqid(),
                'email' => rand(1000, 9999) . uniqid() . '@' . Str::random(10) . '.' . Str::random(3),
                'password' => Hash::make(Str::random(16)),
                'phone_verified_at' => now(),
                'email_verified_at' => now(),
            ];

            $guestUser = $this->userRepository->create($guestUserData);

            // Assign guest role
            $guestUser->assignRole('guest');

            // Handle device token if provided
            $deviceToken = $request->input('device_token');
            $deviceType = $request->input('device_type', 'fcm'); // Default to 'fcm' if not provided
            if ($deviceToken) {
                $this->handleDeviceToken('login', $guestUser, $deviceToken, $deviceType);
            }

            // Create API token
            $token = $guestUser->createToken('api-guest-login')->plainTextToken;

            // Log guest login - guest user is the causer (performed by), not the subject
            $this->logActivity(
                'api_auth',
                "API guest login created: {$guestUser->name}",
                [
                    'user_id' => $guestUser->id,
                    'role' => 'guest',
                    'device_type' => $deviceType ?? null,
                ],
                $guestUser, // subject (performed on)
                $guestUser  // causer (performed by)
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_guest_login_successful'),
                'data' => [
                    'user' => new UserResource($guestUser),
                    'token' => new TokenResource((object)['token' => $token, 'type' => 'Bearer']),
                    'role' => 'guest',
                ]
            ]);
        });
    }
}
