<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GoogleLoginRequest;
use App\Http\Requests\Api\V1\AppleLoginRequest;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Http\Resources\Api\V1\Auth\TokenResource;
use App\Services\GoogleLoginService;
use App\Services\AppleLoginService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SocialAuthController extends Controller
{
    public function __construct(
        private readonly GoogleLoginService $googleLoginService,
        private readonly AppleLoginService $appleLoginService,
        private readonly \App\Contracts\UserRepositoryInterface $userRepository
    ) {}

    /**
     * Google OAuth login
     */
    public function googleLogin(GoogleLoginRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Login with Google token
            $result = $this->googleLoginService->loginWithGoogleToken(
                $data['token'],
                'user',
                $data['device_token'] ?? null,
                $data['device_type'] ?? null
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'errors' => ['token' => [$result['error'] ?? __('common.api.auth.google.login_failed')]]
                ], 401);
            }

            $user = $result['user'];

            // Check if user account status is inactive
            if ($user->status === 'inactive') {
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
            
            // Update last login timestamp using repository
            $this->userRepository->update($user->id, ['last_login_at' => now()]);
            $user->refresh();

            // Log Google login
            $this->logActivity(
                'api_auth',
                "API Google login successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                    'login_method' => 'google_oauth',
                    'device_type' => $data['device_type'] ?? null,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_login_successful'),
                'data' => [
                    'user' => new UserResource($user),
                    'token' => new TokenResource((object)['token' => $result['access_token'], 'type' => 'Bearer']),
                ]
            ]);
        });
    }

    /**
     * Apple Sign In
     */
    public function appleLogin(AppleLoginRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Login with Apple token
            $result = $this->appleLoginService->loginWithAppleToken(
                $data['token'],
                'user',
                $data['device_token'] ?? null,
                $data['device_type'] ?? null
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'errors' => ['token' => [$result['error'] ?? __('common.api.auth.apple.login_failed')]]
                ], 401);
            }

            $user = $result['user'];

            // Check if user account status is inactive
            if ($user->status === 'inactive') {
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
            
            // Update last login timestamp using repository
            $this->userRepository->update($user->id, ['last_login_at' => now()]);
            $user->refresh();

            // Log Apple login
            $this->logActivity(
                'api_auth',
                "API Apple login successful for user: {$user->name}",
                [
                    'user_id' => $user->id,
                    'login_method' => 'apple_signin',
                    'device_type' => $data['device_type'] ?? null,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.api_login_successful'),
                'data' => [
                    'user' => new UserResource($user),
                    'token' => new TokenResource((object)['token' => $result['access_token'], 'type' => 'Bearer']),
                ]
            ]);
        });
    }
}
