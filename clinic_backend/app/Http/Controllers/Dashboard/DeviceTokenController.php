<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DeviceTokenController extends Controller
{
    /**
     * Store web push device token
     * POST /dashboard/device-tokens/web
     */
    public function storeWebToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $token = $request->input('token');
            
            // Create or update device token with type 'web'
            DeviceToken::createOrUpdateForUser($user, $token, 'web');

            Log::info('Web push device token saved', [
                'user_id' => $user->id,
                'token_preview' => substr($token, 0, 20) . '...',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device token saved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save web push device token', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save device token',
            ], 500);
        }
    }

    /**
     * Delete web push device token
     * DELETE /dashboard/device-tokens/web
     */
    public function deleteWebToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $token = $request->input('token');
            
            // Delete device token
            DeviceToken::deleteForUser($user, $token);

            Log::info('Web push device token deleted', [
                'user_id' => $user->id,
                'token_preview' => substr($token, 0, 20) . '...',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device token deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete web push device token', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete device token',
            ], 500);
        }
    }

    /**
     * Check if web push token exists
     * POST /dashboard/device-tokens/web/check
     */
    public function checkWebToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $token = $request->input('token');
            
            $exists = DeviceToken::where('user_id', $user->id)
                ->where('token', $token)
                ->where('type', 'web')
                ->exists();

            return response()->json([
                'success' => true,
                'exists' => $exists,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to check web push device token', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check device token',
            ], 500);
        }
    }
}

