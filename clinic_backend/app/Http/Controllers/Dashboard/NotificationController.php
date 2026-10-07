<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\NotificationRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository
    ) {}

    /**
     * Display a listing of notifications
     */
    public function index(Request $request): Response
    {
        Gate::authorize('notifications.view');
        
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $type = $request->get('type', 'all');
        
        $notifications = $this->notificationRepository->getUserNotifications($user->id, $perPage, $type);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/notifications/index', [
            'notifications' => $notifications,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified notification
     */
    public function show(string|int $id): Response
    {
        Gate::authorize('notifications.show');
        
        $notification = $this->notificationRepository->findOrFail((int) $id);
        
        // Ensure user can only view their own notifications
        $user = request()->user();
        if ($notification->recipient_id !== $user->id) {
            abort(403, __('common.no_permission_to_view_notification'));
        }
        
        // Load relationships for the show page
        $notification->load(['recipient']);

        return Inertia::render('dashboard/notifications/show', [
            'notification' => $notification,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(string|int $id, Request $request)
    {
        Gate::authorize('notifications.mark-read');
        
        $id = (int) $id;
        
        $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            
            // Ensure user can only mark their own notifications as read
            $notification = $this->notificationRepository->findOrFail($id);
            if ($notification->recipient_id !== $user->id) {
                abort(403, __('common.no_permission_to_mark_notification_read'));
            }
            
            $this->notificationRepository->markAsRead($id, $user->id);
        });

        return redirect()->back()->with('success', __('common.notification_marked_as_read'));
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        Gate::authorize('notifications.mark-all-read');
        
        $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $this->notificationRepository->markAllAsRead($user->id);
        });

        return redirect()->back()->with('success', __('common.all_notifications_marked_as_read'));
    }

    /**
     * Remove the specified notification from storage
     */
    public function destroy(Request $request, string|int $id)
    {
        Gate::authorize('notifications.destroy');
        
        $id = (int) $id;
        $currentPage = $request->get('page', 1);
        $perPage = $request->get('per_page', 15);
        
        $this->withTransaction(function () use ($id) {
            $user = request()->user();
            
            // Ensure user can only delete their own notifications
            $notification = $this->notificationRepository->findOrFail($id);
            if ($notification->recipient_id !== $user->id) {
                abort(403, __('common.no_permission_to_delete_notification'));
            }
            
            $this->notificationRepository->delete($id);
        });

        // Check if we need to redirect to previous page
        // Get total count after deletion to determine if we should go back a page
        $user = $request->user();
        $totalAfterDeletion = $this->notificationRepository->getCountForUser($user->id);
        
        $lastPage = max(1, ceil($totalAfterDeletion / $perPage));
        
        // If current page is beyond last page, redirect to last page
        if ($currentPage > $lastPage) {
            $redirectPage = $lastPage;
        } else {
            $redirectPage = $currentPage;
        }

        return redirect()->route('dashboard.notifications.index', [
            'page' => $redirectPage,
            'per_page' => $perPage,
        ])->with('success', __('common.notification_deleted_successfully'));
    }

    /**
     * Get unread notifications count for the authenticated user
     */
    public function getUnreadCount(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'unread_count' => 0,
                ]);
            }

            $count = $this->notificationRepository->getUnreadCountForUser($user->id);

            return response()->json([
                'unread_count' => $count ?? 0,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get unread notification count', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'unread_count' => 0,
            ]);
        }
    }

    /**
     * Get recent notifications (for dropdown)
     */
    public function recent(Request $request)
    {
        $user = $request->user();
        $limit = $request->get('limit', 10);

        $notifications = $this->notificationRepository->getRecentNotifications($user->id, $limit);

        return response()->json([
            'notifications' => $notifications->map(function ($notification) {
                $locale = app()->getLocale();
                $isArabic = $locale === 'ar';
                
                return [
                    'id' => $notification->id,
                    'title' => $isArabic ? ($notification->title_ar ?? $notification->title_en) : ($notification->title_en ?? $notification->title_ar),
                    'message' => $isArabic ? ($notification->description_ar ?? $notification->description_en) : ($notification->description_en ?? $notification->description_ar),
                    'is_read' => $notification->is_read ?? false,
                    'type' => $notification->type ?? 'info',
                    'data' => $notification->data ?? [],
                    'created_at' => $notification->created_at?->toISOString(),
                ];
            }),
        ]);
    }
}