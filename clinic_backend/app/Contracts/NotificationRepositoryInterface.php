<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get user notifications
     */
    public function getUserNotifications(int $userId, int $perPage = 15, string $type = 'all'): LengthAwarePaginator;

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId, int $userId): ?\App\Models\Notification;

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(int $userId): bool;

    /**
     * Delete notification (with optional user verification)
     */
    public function delete(int $id, ?int $userId = null): bool;

    /**
     * Delete all notifications for a user
     */
    public function deleteAll(int $userId): bool;

    /**
     * Get unread notifications count for a specific user
     */
    public function getUnreadCountForUser(int $userId): int;

    /**
     * Get recent notifications for a user
     */
    public function getRecentNotifications(int $userId, int $limit = 10): \Illuminate\Support\Collection;

    /**
     * Get count of notifications for a user
     */
    public function getCountForUser(int $userId): int;
}