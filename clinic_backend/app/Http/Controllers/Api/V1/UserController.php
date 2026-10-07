<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\UpdateProfileRequest;
use App\Http\Requests\Api\V1\User\UploadAvatarRequest;
use App\Http\Requests\Api\V1\User\GetMedicalRecordsRequest;
use App\Http\Requests\Api\V1\User\UploadMedicalRecordRequest;
use App\Http\Requests\Api\V1\User\UpdateMedicalRecordRequest;
use App\Http\Requests\Api\V1\User\GetNotificationSettingsRequest;
use App\Http\Requests\Api\V1\User\UpdateNotificationSettingsRequest;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use App\Contracts\UserRepositoryInterface;
use App\Contracts\MediaRepositoryInterface;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly MediaRepositoryInterface $mediaRepository
    ) {}

    /**
     * Update user profile
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $user = $request->user();

            // Remove null values to only update provided fields
            $data = array_filter($data, fn($value) => !is_null($value));

            // If phone number is being updated, reset phone verification
            if (isset($data['phone']) && $data['phone'] !== $user->phone) {
                $data['phone_verified_at'] = null;
            }

            // Update user profile
            $user = $this->userRepository->update($user->id, $data);

            return response()->json([
                'success' => true,
                'message' => __('common.profile_updated_successfully'),
                'data' => [
                    'user' => new UserResource($user),
                ]
            ]);
        });
    }

    /**
     * Upload user avatar
     */
    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $avatar = $request->file('avatar');

            // Delete old avatar if exists - convert URL back to path for deletion
            if ($user->avatar) {
                // Extract path from URL (remove /storage/ prefix if present)
                $oldPath = str_replace('/storage/', '', parse_url($user->avatar, PHP_URL_PATH));
                $fullPath = 'public/' . $oldPath;
                
                if (Storage::exists($fullPath)) {
                    Storage::delete($fullPath);
                }
            }

            // Store new avatar
            $path = $avatar->store('avatars', 'public');
            $avatarUrl = url(Storage::url($path)); // Generate full URL with domain
            $this->userRepository->update($user->id, ['avatar' => $avatarUrl]);
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => __('common.avatar_uploaded_successfully'),
                'data' => [
                    'user' => new UserResource($user),
                    'avatar_url' => $avatarUrl,
                ]
            ]);
        });
    }

    /**
     * Get user medical records
     */
    public function getMedicalRecords(GetMedicalRecordsRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $data = $request->validated();
            
            $filters = [
                'search' => $data['search'] ?? null,
                'date_from' => $data['date_from'] ?? null,
                'date_to' => $data['date_to'] ?? null,
            ];
            
            $perPage = $data['per_page'] ?? 15;
            $records = $this->mediaRepository->getMedicalRecords($user->id, $filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'medical_records' => MediaResource::collection($records->getCollection()),
                    'pagination' => [
                        'current_page' => $records->currentPage(),
                        'last_page' => $records->lastPage(),
                        'per_page' => $records->perPage(),
                        'total' => $records->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Upload medical record
     */
    public function uploadMedicalRecord(UploadMedicalRecordRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $data = $request->validated();

            $file = $request->file('file');
            $path = $file->store('medical-records', 'public');
            $url = url(Storage::url($path)); // Generate full URL with domain

            $recordData = [
                'mediable_type' => User::class,
                'mediable_id' => $user->id,
                'file_name' => $url,
                'collection_name' => 'medical-records',
                'disk' => 'public',
                'size' => $file->getSize(),
            ];

            $record = $this->mediaRepository->create($recordData);

            return response()->json([
                'success' => true,
                'message' => __('common.medical_record_uploaded_successfully'),
                'data' => [
                    'medical_record' => new MediaResource($record),
                    'download_url' => $url,
                ]
            ], 201);
        });
    }

    /**
     * Update medical record
     */
    public function updateMedicalRecord(int $id, UpdateMedicalRecordRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $data = $request->validated();
            
            $record = $this->mediaRepository->findMedicalRecord($id, $user->id);
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.medical_record_not_found'),
                ], 404);
            }

            $this->mediaRepository->update($id, $data);

            $updatedRecord = $this->mediaRepository->find($id);
            return response()->json([
                'success' => true,
                'message' => __('common.medical_record_updated_successfully'),
                'data' => [
                    'medical_record' => new MediaResource($updatedRecord),
                ]
            ]);
        });
    }

    /**
     * Delete medical record
     */
    public function deleteMedicalRecord(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            
            $record = $this->mediaRepository->findMedicalRecord($id, $user->id);
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.medical_record_not_found'),
                ], 404);
            }

            // Delete file if exists - convert URL back to path for deletion
            if ($record->file_name) {
                // Extract path from URL (remove /storage/ prefix if present)
                $filePath = str_replace('/storage/', '', parse_url($record->file_name, PHP_URL_PATH));
                $fullPath = 'public/' . $filePath;
                
                if (Storage::exists($fullPath)) {
                    Storage::delete($fullPath);
                }
            }

            $this->mediaRepository->delete($id);

            return response()->json([
                'success' => true,
                'message' => __('common.medical_record_deleted_successfully'),
            ]);
        });
    }

    /**
     * Download medical record
     */
    public function downloadMedicalRecord(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            
            $record = $this->mediaRepository->findMedicalRecord($id, $user->id);
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.medical_record_not_found'),
                ], 404);
            }

            if (!$record->file_name) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.file_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'download_url' => $record->file_name,
                    'file_name' => basename(parse_url($record->file_name, PHP_URL_PATH)),
                ]
            ]);
        });
    }

    /**
     * Get notification settings
     * Only accessible for users with 'user' role
     */
    public function getNotificationSettings(GetNotificationSettingsRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            
            // Only allow users with 'user' role (not admin, clinic, etc.)
            if (!$user->hasRole('user') || $user->hasRole('super-admin')) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.access_denied'),
                ], 403);
            }
            
            // Get notification settings from user model or default settings
            $settings = [
                'appointment_reminders' => $user->notification_settings['appointment_reminders'] ?? true,
                'reschedule_alerts' => $user->notification_settings['reschedule_alerts'] ?? true,
                'promotions_offers' => $user->notification_settings['promotions_offers'] ?? true,
                'payment_confirmations' => $user->notification_settings['payment_confirmations'] ?? true,
                'review_requests' => $user->notification_settings['review_requests'] ?? true,
                'special_offers' => $user->notification_settings['special_offers'] ?? true,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'notification_settings' => $settings,
                ]
            ]);
        });
    }

    /**
     * Update notification settings
     * Only accessible for users with 'user' role
     */
    public function updateNotificationSettings(UpdateNotificationSettingsRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            
            // Only allow users with 'user' role (not admin, clinic, etc.)
            if (!$user->hasRole('user') || $user->hasRole('super-admin')) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.access_denied'),
                ], 403);
            }
            
            $data = $request->validated();

            // Update notification settings on user model
            $currentSettings = $user->notification_settings ?? [];
            $updatedSettings = array_merge($currentSettings, $data);
            
            $this->userRepository->update($user->id, ['notification_settings' => $updatedSettings]);

            return response()->json([
                'success' => true,
                'message' => __('common.notification_settings_updated_successfully'),
                'data' => [
                    'notification_settings' => $updatedSettings,
                ]
            ]);
        });
    }
}
