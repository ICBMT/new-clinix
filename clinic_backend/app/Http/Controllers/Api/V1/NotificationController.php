<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Notification\NotificationResource;
use App\Contracts\NotificationRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository
    ) {}

    /**
     * Get user notifications
     */
    public function index(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $perPage = $request->get('per_page', 15);
            $type = $request->get('type', 'all'); // all, unread, promo, account, appointment

            $notifications = $this->notificationRepository->getUserNotifications($user->id, $perPage, $type);

            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => NotificationResource::collection($notifications->items()),
                    'pagination' => [
                        'current_page' => $notifications->currentPage(),
                        'last_page' => $notifications->lastPage(),
                        'per_page' => $notifications->perPage(),
                        'total' => $notifications->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Delete notification
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $deleted = $this->notificationRepository->delete($id, $user->id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.notification_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => __('common.notification_deleted'),
            ]);
        });
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();

            // Mark notification as read
            $notification = $this->notificationRepository->markAsRead($id, $user->id);

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.notification_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => __('common.notification_marked_as_read'),
                'data' => [
                    'notification' => new NotificationResource($notification),
                ]
            ]);
        });
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();

            // Mark all notifications as read
            $this->notificationRepository->markAllAsRead($user->id);

            // Log action
            $this->logActivity(
                'notifications',
                "All notifications marked as read for user: {$user->name}",
                [
                    'user_id' => $user->id,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.all_notifications_marked_as_read'),
            ]);
        });
    }

    /**
     * Delete all notifications
     */
    public function deleteAll(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $this->notificationRepository->deleteAll($user->id);

            $this->logActivity(
                'notifications',
                "All notifications deleted for user: {$user->name}",
                [
                    'user_id' => $user->id,
                ],
                $user
            );

            return response()->json([
                'success' => true,
                'message' => __('common.all_notifications_deleted'),
            ]);
        });
    }

}
