<?php

namespace App\Repositories;

use App\Contracts\NotificationRepositoryInterface;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationRepository extends BaseRepository implements NotificationRepositoryInterface
{
    /**
     * NotificationRepository constructor
     */
    public function __construct(Notification $model)
    {
        parent::__construct($model);
    }

    /**
     * Get searchable fields for notifications
     */
    protected function getSearchableFields(): array
    {
        return [
            'title_en',
            'title_ar',
            'description_en',
            'description_ar',
        ];
    }

    /**
     * Get filterable fields for notifications
     */
    protected function getFilterableFields(): array
    {
        return [
            'recipient_type',
            'is_read',
            'created_at',
            'updated_at',
        ];
    }

    /**
     * Get paginated notifications (alias for paginate method)
     * Filters by logged-in user for all roles
     * Shows all notifications for the user regardless of recipient_type
     */
    public function getPaginated(Request $request, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();
        
        // Filter by logged-in user for all roles
        // Show all notifications for this user (users, admins, guests, clinics, etc.)
        // This ensures users see all their notifications including broadcast notifications
        $user = $request->user();
        if ($user) {
            $query->where('recipient_id', $user->id);
        }
        
        // Apply filters
        $query = $this->applyCustomFilters($query, $request);
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        return $query->paginate($perPage);
    }

    /**
     * Get notifications by recipient type
     */
    public function getByRecipientTypePaginated(string $recipientType, Request $request, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();
        
        // Filter by recipient type
        $query->where('recipient_type', $recipientType);
        
        // Apply filters
        $query = $this->applyCustomFilters($query, $request);
        $query = $this->applySearch($query, $request);
        $query = $this->applySorting($query, $request);
        $query = $this->applyRelationships($query, $request);

        return $query->paginate($perPage);
    }

    /**
     * Get user notifications
     * Shows all notifications for the user regardless of recipient_type
     * This includes notifications from broadcasts, regular notifications, etc.
     */
    public function getUserNotifications(int $userId, int $perPage = 15, string $type = 'all'): LengthAwarePaginator
    {
        $query = $this->model->where('recipient_id', $userId);

        // Filter by type
        switch ($type) {
            case 'unread':
                $query->where('is_read', false);
                break;
            case 'read':
                $query->where('is_read', true);
                break;
            case 'promo':
                $query->where('type', 'promo');
                break;
            case 'account':
                $query->where('type', 'account');
                break;
            case 'appointment':
                $query->where('type', 'appointment');
                break;
            case 'all':
            default:
                // No additional filter
                break;
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId, int $userId): ?Notification
    {
        // Filter by recipient_id only (works for all recipient types: admins, users, clinics, etc.)
        $notification = $this->model->where('id', $notificationId)
            ->where('recipient_id', $userId)
            ->first();
        
        if (!$notification) {
            return null;
        }
        
        $notification->update(['is_read' => true]);
        return $notification->fresh();
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(int $userId): bool
    {
        // Filter by recipient_id only (works for all recipient types: admins, users, clinics, etc.)
        return $this->model->where('recipient_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]) > 0;
    }

    /**
     * Delete notification (with user verification)
     */
    public function delete(int $id, ?int $userId = null): bool
    {
        $query = $this->model->where('id', $id);
        
        // If userId provided, verify ownership (works for all recipient types)
        if ($userId !== null) {
            $query->where('recipient_id', $userId);
        }
        
        $notification = $query->first();
        
        if (!$notification) {
            return false;
        }
        
        return $notification->delete();
    }

    /**
     * Delete all notifications for a user
     */
    public function deleteAll(int $userId): bool
    {
        // Filter by recipient_id only (works for all recipient types: admins, users, clinics, etc.)
        return $this->model->where('recipient_id', $userId)
            ->delete() > 0;
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount(): int
    {
        return $this->model->where('is_read', false)->count();
    }

    /**
     * Get unread notifications count for a specific user
     * Includes both 'users' and 'guests' recipient types
     */
    public function getUnreadCountForUser(int $userId): int
    {
        return $this->model->where('recipient_id', $userId)
            ->whereIn('recipient_type', ['users', 'guests'])
            ->where('is_read', false)
            ->count();
    }

    /**
     * Get recent notifications for a user
     * Includes both 'users' and 'guests' recipient types
     */
    public function getRecentNotifications(int $userId, int $limit = 10): \Illuminate\Support\Collection
    {
        return $this->model->where('recipient_id', $userId)
            ->whereIn('recipient_type', ['users', 'guests'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get count of notifications for a user
     * Includes both 'users' and 'guests' recipient types
     */
    public function getCountForUser(int $userId): int
    {
        return $this->model->where('recipient_id', $userId)
            ->whereIn('recipient_type', ['users', 'guests'])
            ->count();
    }

    /**
     * Apply custom filters for notifications
     */
    protected function applyCustomFilters($query, Request $request)
    {
        $filters = $request->get('filters', []);

        // Read/Unread filter
        if (isset($filters['is_read']) && $filters['is_read'] !== '') {
            $query->where('is_read', $filters['is_read']);
        }

        return $query;
    }
}
