<?php

namespace App\Services;

use App\Models\Broadcast;
use App\Models\Notification;
use App\Models\User;
use App\Jobs\SendBroadcastNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Create and send a broadcast notification (complete flow)
     */
    public function createAndSendBroadcast(Broadcast $broadcast): array
    {
        try {
            // Determine status based on scheduled_at
            // If scheduled_at is in the future, mark as 'scheduled', otherwise mark as 'sent'
            $now = now();
            $scheduledAt = $broadcast->scheduled_at;
            
            if ($scheduledAt && $scheduledAt->isFuture()) {
                // Broadcast is scheduled for future, mark as 'scheduled'
                $broadcast->update(['status' => 'scheduled']);
            } else {
                // Broadcast is being sent immediately, mark as 'sent'
                $broadcast->update(['status' => 'sent']);
            }

            // Execute the job synchronously (immediately, no queue)
            // This sends Firebase notifications and creates database notifications instantly
            SendBroadcastNotification::dispatchSync($broadcast);

            Log::info("Broadcast notification sent successfully (synchronous)", [
                'broadcast_id' => $broadcast->id,
                'title_en' => $broadcast->getTitle('en'),
                'title_ar' => $broadcast->getTitle('ar'),
                'target_roles' => $broadcast->target_roles,
                'recipients' => $broadcast->recipients,
            ]);

            return [
                'success' => true,
                'message' => __('common.notification.broadcast.sent_successfully'),
                'broadcast_id' => $broadcast->id,
            ];

        } catch (\Exception $e) {
            Log::error("Failed to dispatch broadcast notification", [
                'broadcast_id' => $broadcast->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => __('common.notification.broadcast.dispatch_failed'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create notifications for a broadcast (internal method)
     * Filters users based on notification settings (for user role only)
     */
    public function createBroadcastNotifications(Broadcast $broadcast, Collection|array $users): array
    {
        $notifications = [];
        $errors = [];

        foreach ($users as $user) {
            try {
                // Check user notification settings (only for user role)
                // Broadcasts are treated as promotions/offers
                if ($user->hasRole('user') && !$user->hasRole('super-admin')) {
                    $settings = $user->notification_settings ?? [];
                    // Check if promotions_offers is enabled (default to true if not set)
                    $promotionsEnabled = $settings['promotions_offers'] ?? true;
                    
                    if (!$promotionsEnabled) {
                        Log::info("Skipping broadcast notification - promotions_offers disabled for user", [
                            'user_id' => $user->id,
                            'broadcast_id' => $broadcast->id,
                        ]);
                        continue; // Skip creating notification for this user
                    }
                }
                
                // Create notification without triggering push notification
                // Push notifications are already sent via Firebase topics in SendBroadcastNotification job
                $notification = $this->createNotificationForUser(
                    $user,
                    'admin_broadcast',
                    $broadcast->getTitle('en'),
                    $broadcast->getTitle('ar'),
                    $broadcast->getMessage('en'),
                    $broadcast->getMessage('ar'),
                    [
                        'broadcast_id' => $broadcast->id,
                        'sent_by' => $broadcast->sent_by,
                        'target_roles' => $broadcast->target_roles,
                    ],
                    $broadcast,
                    true // Skip push notification - already sent via Firebase topics
                );

                $notifications[] = $notification;
            } catch (\Exception $e) {
                $errors[] = [
                    'recipient_id' => $user->id,
                    'error' => $e->getMessage(),
                ];
                Log::error("Failed to create broadcast notification for user {$user->id}", [
                    'broadcast_id' => $broadcast->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'notifications' => $notifications,
            'errors' => $errors,
            'success_count' => count($notifications),
            'error_count' => count($errors),
        ];
    }

    /**
     * Create and send a simple notification (complete flow)
     * Note: Push notification is automatically dispatched via Notification model boot function
     */
    public function createAndSendNotification(
        User $user,
        string $type,
        string $titleEn,
        string $titleAr,
        string $messageEn,
        string $messageAr,
        array $data = [],
        $notifiable = null,
        bool $sendPush = true
    ): array {
        try {
            $notification = $this->createNotificationForUser(
                $user,
                $type,
                $titleEn,
                $titleAr,
                $messageEn,
                $messageAr,
                $data,
                $notifiable
            );

            Log::info("Simple notification created", [
                'notification_id' => $notification->id,
                'recipient_id' => $user->id,
                'type' => $type,
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'send_push' => $sendPush,
            ]);

            return [
                'success' => true,
                'message' => __('common.notification.created_successfully'),
                'notification' => $notification,
            ];

        } catch (\Exception $e) {
            Log::error("Failed to create and send notification", [
                'recipient_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => __('common.notification.create_failed'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create system notification
     * Note: This method requires both English and Arabic translations to be provided
     */
    public function createSystemNotification(
        User $user, 
        string $titleEn, 
        string $titleAr, 
        string $bodyEn, 
        string $bodyAr, 
        array $data = []
    ): Notification {
        return $this->createNotificationForUser(
            $user,
            'system',
            $titleEn,
            $titleAr,
            $bodyEn,
            $bodyAr,
            $data
        );
    }

    /**
     * Create and send system notification with push
     */
    public function createAndSendSystemNotification(
        User $user, 
        string $titleEn, 
        string $titleAr, 
        string $messageEn, 
        string $messageAr, 
        array $data = [],
        bool $sendPush = true
    ): array {
        return $this->createAndSendNotification(
            $user,
            'system',
            $titleEn,
            $titleAr,
            $messageEn,
            $messageAr,
            $data,
            null,
            $sendPush
        );
    }

    /**
     * Create notification for a specific user (common method)
     */
    public function createNotificationForUser(
        User $user,
        string $type,
        string $titleEn,
        string $titleAr,
        string $messageEn,
        string $messageAr,
        array $data = [],
        $notifiable = null,
        bool $skipPushNotification = false
    ): Notification {
        $notificationData = [
            'recipient_id' => $user->id,
            'recipient_type' => $this->getUserRecipientType($user),
            'type' => $type,
            'title_en' => $titleEn,
            'title_ar' => $titleAr,
            'description_en' => $messageEn,
            'description_ar' => $messageAr,
            'data' => $data,
            'is_read' => false,
        ];

        // Add notifiable relationship if provided
        if ($notifiable) {
            $notificationData['notifiable_id'] = $notifiable->id;
            $notificationData['notifiable_type'] = get_class($notifiable);
        }

        // Add broadcast_id if it's a broadcast notification
        if ($notifiable instanceof Broadcast) {
            $notificationData['broadcast_id'] = $notifiable->id;
        }

        return $this->createNotification($notificationData, $skipPushNotification);
    }

    /**
     * Create bulk notifications for multiple users
     */
    public function createBulkNotifications(
        Collection|array $users,
        string $type,
        string $titleEn,
        string $titleAr,
        string $messageEn,
        string $messageAr,
        array $data = [],
        $notifiable = null
    ): array {
        $notifications = [];
        $errors = [];

        foreach ($users as $user) {
            try {
                $notification = $this->createNotificationForUser(
                    $user,
                    $type,
                    $titleEn,
                    $titleAr,
                    $messageEn,
                    $messageAr,
                    $data,
                    $notifiable
                );

                $notifications[] = $notification;
            } catch (\Exception $e) {
                $errors[] = [
                    'recipient_id' => $user->id,
                    'error' => $e->getMessage(),
                ];
                Log::error("Failed to create bulk notification for user {$user->id}", [
                    'type' => $type,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'notifications' => $notifications,
            'errors' => $errors,
            'success_count' => count($notifications),
            'error_count' => count($errors),
        ];
    }

    /**
     * Create a single notification (base method)
     * @param bool $skipPushNotification If true, creates notification without triggering push notification
     */
    public function createNotification(array $data, bool $skipPushNotification = false): Notification
    {
        if ($skipPushNotification) {
            // Use withoutEvents to prevent the boot method from dispatching push notifications
            return Notification::withoutEvents(function () use ($data) {
                return Notification::create($data);
            });
        }
        
        return Notification::create($data);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification): bool
    {
        try {
            $notification->markAsRead();
            
            Log::info("Notification marked as read", [
                'notification_id' => $notification->id,
                'recipient_id' => $notification->recipient_id,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to mark notification as read", [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(Notification $notification): bool
    {
        try {
            $notification->update(['is_read' => false]);
            
            Log::info("Notification marked as unread", [
                'notification_id' => $notification->id,
                'recipient_id' => $notification->recipient_id,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to mark notification as unread", [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Toggle notification read status
     */
    public function toggleReadStatus(Notification $notification): bool
    {
        try {
            $newStatus = !$notification->is_read;
            $notification->update(['is_read' => $newStatus]);
            
            Log::info("Notification read status toggled", [
                'notification_id' => $notification->id,
                'recipient_id' => $notification->recipient_id,
                'new_status' => $newStatus ? 'read' : 'unread',
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to toggle notification read status", [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Mark multiple notifications as read
     */
    public function markMultipleAsRead(array $notificationIds): int
    {
        try {
            $count = Notification::whereIn('id', $notificationIds)
                ->where('is_read', false)
                ->update(['is_read' => true]);
                
            Log::info("Multiple notifications marked as read", [
                'notification_ids' => $notificationIds,
                'count' => $count,
            ]);
            
            return $count;
        } catch (\Exception $e) {
            Log::error("Failed to mark multiple notifications as read", [
                'notification_ids' => $notificationIds,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Mark multiple notifications as unread
     */
    public function markMultipleAsUnread(array $notificationIds): int
    {
        try {
            $count = Notification::whereIn('id', $notificationIds)
                ->where('is_read', true)
                ->update(['is_read' => false]);
                
            Log::info("Multiple notifications marked as unread", [
                'notification_ids' => $notificationIds,
                'count' => $count,
            ]);
            
            return $count;
        } catch (\Exception $e) {
            Log::error("Failed to mark multiple notifications as unread", [
                'notification_ids' => $notificationIds,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Delete notification
     */
    public function deleteNotification(Notification $notification): bool
    {
        try {
            $notificationId = $notification->id;
            $recipientId = $notification->recipient_id;
            
            $notification->delete();
            
            Log::info("Notification deleted", [
                'notification_id' => $notificationId,
                'recipient_id' => $recipientId,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to delete notification", [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Delete multiple notifications
     */
    public function deleteMultipleNotifications(array $notificationIds): int
    {
        try {
            $count = Notification::whereIn('id', $notificationIds)->delete();
            
            Log::info("Multiple notifications deleted", [
                'notification_ids' => $notificationIds,
                'count' => $count,
            ]);
            
            return $count;
        } catch (\Exception $e) {
            Log::error("Failed to delete multiple notifications", [
                'notification_ids' => $notificationIds,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsReadForUser(User $user): int
    {
        try {
            return $user->notifications()
                ->where('is_read', false)
                ->update(['is_read' => true]);
        } catch (\Exception $e) {
            Log::error("Failed to mark all notifications as read for user {$user->id}", [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Get notification statistics for a user
     */
    public function getUserNotificationStats(User $user): array
    {
        try {
            $total = $user->notifications()->count();
            $unread = $user->notifications()->where('is_read', false)->count();
            $read = $total - $unread;
            
            $byType = $user->notifications()
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();
            
            $byRecipientType = $user->notifications()
                ->selectRaw('recipient_type, COUNT(*) as count')
                ->groupBy('recipient_type')
                ->pluck('count', 'recipient_type')
                ->toArray();
            
            return [
                'total' => $total,
                'unread' => $unread,
                'read' => $read,
                'by_type' => $byType,
                'by_recipient_type' => $byRecipientType,
                'unread_percentage' => $total > 0 ? round(($unread / $total) * 100, 2) : 0,
            ];
            
        } catch (\Exception $e) {
            Log::error("Failed to get user notification stats", [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'total' => 0,
                'unread' => 0,
                'read' => 0,
                'by_type' => [],
                'by_recipient_type' => [],
                'unread_percentage' => 0,
            ];
        }
    }

    /**
     * Get notification statistics for all users
     */
    public function getGlobalNotificationStats(): array
    {
        try {
            $total = Notification::count();
            $unread = Notification::where('is_read', false)->count();
            $read = $total - $unread;
            
            $byType = Notification::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();
            
            $byRecipientType = Notification::selectRaw('recipient_type, COUNT(*) as count')
                ->groupBy('recipient_type')
                ->pluck('count', 'recipient_type')
                ->toArray();
            
            $recentActivity = Notification::where('created_at', '>=', now()->subDays(7))
                ->count();
            
            return [
                'total' => $total,
                'unread' => $unread,
                'read' => $read,
                'by_type' => $byType,
                'by_recipient_type' => $byRecipientType,
                'recent_activity' => $recentActivity,
                'unread_percentage' => $total > 0 ? round(($unread / $total) * 100, 2) : 0,
            ];
            
        } catch (\Exception $e) {
            Log::error("Failed to get global notification stats", [
                'error' => $e->getMessage(),
            ]);
            
            return [
                'total' => 0,
                'unread' => 0,
                'read' => 0,
                'by_type' => [],
                'by_recipient_type' => [],
                'recent_activity' => 0,
                'unread_percentage' => 0,
            ];
        }
    }

    /**
     * Get user's unread notifications count
     */
    public function getUnreadCount(User $user): int
    {
        return $user->notifications()->where('is_read', false)->count();
    }

    /**
     * Get user's unread notifications count by type
     */
    public function getUnreadCountByType(User $user, string $type): int
    {
        return $user->notifications()
            ->where('is_read', false)
            ->where('type', $type)
            ->count();
    }

    /**
     * Delete old notifications (cleanup method)
     */
    public function deleteOldNotifications(int $daysOld = 30): int
    {
        try {
            $count = Notification::where('created_at', '<', now()->subDays($daysOld))
                ->delete();
                
            Log::info("Old notifications deleted", [
                'days_old' => $daysOld,
                'count' => $count,
            ]);
            
            return $count;
        } catch (\Exception $e) {
            Log::error("Failed to delete old notifications", [
                'days_old' => $daysOld,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Clean up notifications by type
     */
    public function deleteNotificationsByType(string $type, int $daysOld = 30): int
    {
        try {
            $count = Notification::where('type', $type)
                ->where('created_at', '<', now()->subDays($daysOld))
                ->delete();
                
            Log::info("Notifications deleted by type", [
                'type' => $type,
                'days_old' => $daysOld,
                'count' => $count,
            ]);
            
            return $count;
        } catch (\Exception $e) {
            Log::error("Failed to delete notifications by type", [
                'type' => $type,
                'days_old' => $daysOld,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Get clinic staff (clinic role and clinic_manager role) for a clinic
     */
    private function getClinicStaff(\App\Models\Clinic $clinic): \Illuminate\Support\Collection
    {
        // Get clinic owner (clinic role)
        $staff = collect();
        if ($clinic->owner && $clinic->owner->hasRole('clinic')) {
            $staff->push($clinic->owner);
        }

        // Get clinic managers and clinic role users associated with the clinic
        $clinicStaff = \App\Models\User::whereHas('clinics', function($q) use ($clinic) {
            $q->where('clinics.id', $clinic->id);
        })
        ->where(function($q) {
            $q->whereHas('roles', function($roleQ) {
                $roleQ->whereIn('name', ['clinic', 'clinic_manager']);
            });
        })
        ->get();

        return $staff->merge($clinicStaff)->unique('id');
    }

    /**
     * Get all super admin users
     */
    private function getSuperAdmins(): \Illuminate\Support\Collection
    {
        return \App\Models\User::role('super-admin')->get();
    }

    /**
     * Notify clinic owner when a new booking is created
     */
    public function notifyBookingCreated(\App\Models\Booking $booking): void
    {
        try {
            $booking->loadMissing(['user', 'clinic', 'treatment']);
            
            $clinic = $booking->clinic;
            if (!$clinic) {
                return;
            }

            $user = $booking->user;
            if (!$user) {
                return;
            }

            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';
            $treatmentName = $booking->treatment ? ($booking->treatment->name_en ?? $booking->treatment->name_ar ?? 'Treatment') : 'Treatment';
            $treatmentNameAr = $booking->treatment ? ($booking->treatment->name_ar ?? $booking->treatment->name_en ?? 'علاج') : 'علاج';

            // 1. Notify the user who made the booking
            $this->createAndSendNotification(
                $user,
                'booking_created',
                "Booking Confirmed: {$booking->booking_reference}",
                "تم تأكيد الحجز: {$booking->booking_reference}",
                "Your booking {$booking->booking_reference} for {$treatmentName} at {$clinicName} has been created.",
                "تم إنشاء حجزك {$booking->booking_reference} لـ {$treatmentNameAr} في {$clinicNameAr}.",
                [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'clinic_id' => $clinic->id,
                    'clinic_name_en' => $clinic->name_en,
                    'clinic_name_ar' => $clinic->name_ar,
                    'treatment_id' => $booking->treatment_id,
                    'total_amount' => $booking->total_amount,
                ],
                $booking
            );

            // 2. Notify clinic staff (clinic role and clinic_manager role)
            $clinicStaff = $this->getClinicStaff($clinic);
            foreach ($clinicStaff as $staffMember) {
                $this->createAndSendNotification(
                    $staffMember,
                    'booking_created',
                    "New Booking: {$booking->booking_reference}",
                    "حجز جديد: {$booking->booking_reference}",
                    "You have a new booking from {$user->name} for {$clinicName}.",
                    "لديك حجز جديد من {$user->name} لـ {$clinicName}.",
                    [
                        'booking_id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'treatment_id' => $booking->treatment_id,
                        'total_amount' => $booking->total_amount,
                    ],
                    $booking
                );
            }

            // 3. Notify super admins
            $superAdmins = $this->getSuperAdmins();
            foreach ($superAdmins as $admin) {
                $this->createAndSendNotification(
                    $admin,
                    'booking_created',
                    "New Booking: {$booking->booking_reference}",
                    "حجز جديد: {$booking->booking_reference}",
                    "New booking {$booking->booking_reference} from {$user->name} for {$clinicName}.",
                    "حجز جديد {$booking->booking_reference} من {$user->name} لـ {$clinicName}.",
                    [
                        'booking_id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'treatment_id' => $booking->treatment_id,
                        'total_amount' => $booking->total_amount,
                    ],
                    $booking
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send booking created notification", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify user when booking status is updated
     */
    public function notifyBookingStatusUpdated(\App\Models\Booking $booking, string $oldStatus, string $newStatus): void
    {
        try {
            $user = $booking->user;
            if (!$user) {
                return;
            }

            $clinic = $booking->clinic;
            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';

            $statusMessages = [
                'confirmed' => [
                    'en' => "Your booking {$booking->booking_reference} has been confirmed for {$clinicName}.",
                    'ar' => "تم تأكيد حجزك {$booking->booking_reference} لـ {$clinicNameAr}.",
                ],
                'cancelled' => [
                    'en' => "Your booking {$booking->booking_reference} has been cancelled.",
                    'ar' => "تم إلغاء حجزك {$booking->booking_reference}.",
                ],
                'rejected' => [
                    'en' => "Your booking {$booking->booking_reference} has been rejected.",
                    'ar' => "تم رفض حجزك {$booking->booking_reference}.",
                ],
                'completed' => [
                    'en' => "Your booking {$booking->booking_reference} has been completed.",
                    'ar' => "تم إكمال حجزك {$booking->booking_reference}.",
                ],
            ];

            $statusTranslations = [
                'upcoming' => ['en' => 'upcoming', 'ar' => 'قادم'],
                'accepted' => ['en' => 'accepted', 'ar' => 'مقبول'],
                'confirmed' => ['en' => 'confirmed', 'ar' => 'مؤكد'],
                'cancelled' => ['en' => 'cancelled', 'ar' => 'ملغي'],
                'rejected' => ['en' => 'rejected', 'ar' => 'مرفوض'],
                'completed' => ['en' => 'completed', 'ar' => 'مكتمل'],
                'past' => ['en' => 'past', 'ar' => 'منتهي'],
            ];
            
            $statusAr = $statusTranslations[$newStatus]['ar'] ?? $newStatus;

            $messages = $statusMessages[$newStatus] ?? [
                'en' => "Your booking {$booking->booking_reference} status has been changed to {$newStatus}.",
                'ar' => "تم تغيير حالة حجزك {$booking->booking_reference} إلى {$statusAr}.",
            ];

            $this->createAndSendNotification(
                $user,
                'booking_status_updated',
                "Booking Status Updated: {$booking->booking_reference}",
                "تم تحديث حالة الحجز: {$booking->booking_reference}",
                $messages['en'],
                $messages['ar'],
                [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'clinic_id' => $clinic->id,
                    'clinic_name_en' => $clinic->name_en,
                    'clinic_name_ar' => $clinic->name_ar,
                ],
                $booking
            );
        } catch (\Exception $e) {
            Log::error("Failed to send booking status updated notification", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic when booking session is marked as completed
     */
    public function notifyBookingSessionCompleted(\App\Models\BookingSession $session): void
    {
        try {
            $booking = $session->booking;
            if (!$booking) {
                return;
            }

            $clinic = $booking->clinic;
            if (!$clinic || !$clinic->owner) {
                return;
            }

            $user = $booking->user;
            $sessionDate = $session->slot_date?->format('Y-m-d') ?? 'N/A';
            $sessionDateAr = $session->slot_date ? $session->slot_date->format('Y-m-d') : 'غير متاح';

            $this->createAndSendNotification(
                $clinic->owner,
                'booking_session_completed',
                "Session Completed: {$booking->booking_reference}",
                "تم إكمال الجلسة: {$booking->booking_reference}",
                "Session on {$sessionDate} for booking {$booking->booking_reference} has been marked as completed.",
                "تم تحديد الجلسة في {$sessionDateAr} للحجز {$booking->booking_reference} كمكتملة.",
                [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'session_id' => $session->id,
                    'session_date' => $sessionDate,
                    'clinic_id' => $clinic->id,
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                ],
                $session
            );
        } catch (\Exception $e) {
            Log::error("Failed to send booking session completed notification", [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic when they are favorited by a user
     */
    public function notifyClinicFavorited(\App\Models\Favorite $favorite): void
    {
        try {
            // Only notify if favoritable is a clinic
            if ($favorite->favoritable_type !== \App\Models\Clinic::class) {
                return;
            }

            $clinic = $favorite->favoritable;
            if (!$clinic) {
                return;
            }

            $user = $favorite->user;
            if (!$user) {
                return;
            }

            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';

            // Notify clinic staff (clinic role and clinic_manager role)
            $clinicStaff = $this->getClinicStaff($clinic);
            foreach ($clinicStaff as $staffMember) {
                $this->createAndSendNotification(
                    $staffMember,
                    'clinic_favorited',
                    "You've Been Favorited!",
                    "تم إضافتك للمفضلة!",
                    "{$user->name} has added {$clinicName} to their favorites.",
                    "أضاف {$user->name} {$clinicNameAr} إلى مفضلته.",
                    [
                        'favorite_id' => $favorite->id,
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                    ],
                    $favorite
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send clinic favorited notification", [
                'favorite_id' => $favorite->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic when review is created
     */
    public function notifyReviewCreated(\App\Models\Review $review): void
    {
        try {
            $clinic = $review->clinic;
            if (!$clinic) {
                return;
            }

            $user = $review->user;
            if (!$user) {
                return;
            }

            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';

            // Notify clinic staff (clinic role and clinic_manager role)
            $clinicStaff = $this->getClinicStaff($clinic);
            foreach ($clinicStaff as $staffMember) {
                $this->createAndSendNotification(
                    $staffMember,
                    'review_received',
                    "New Review Received",
                    "تم استلام تقييم جديد",
                    "You have received a {$review->rating}-star rating from {$user->name} for {$clinicName}.",
                    "لقد تلقيت تقييم {$review->rating} نجوم من {$user->name} لـ {$clinicNameAr}.",
                    [
                        'review_id' => $review->id,
                        'booking_id' => $review->booking_id,
                        'rating' => $review->rating,
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                    ],
                    $review
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send review created notification", [
                'review_id' => $review->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic staff when new earning is created
     */
    public function notifyEarningCreated(\App\Models\ClinicEarning $earning): void
    {
        try {
            $earning->loadMissing(['clinic', 'booking']);
            $clinic = $earning->clinic;
            if (!$clinic) {
                return;
            }

            $booking = $earning->booking;
            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';
            $bookingReference = $booking ? ($booking->booking_reference ?? 'N/A') : 'N/A';
            $bookingReferenceAr = $booking ? ($booking->booking_reference ?? 'غير متاح') : 'غير متاح';

            // Notify clinic staff (clinic role and clinic_manager role)
            $clinicStaff = $this->getClinicStaff($clinic);
            foreach ($clinicStaff as $staffMember) {
                $this->createAndSendNotification(
                    $staffMember,
                    'earning_created',
                    "New Earning: {$earning->net_amount} {$earning->currency}",
                    "كسب جديد: {$earning->net_amount} {$earning->currency}",
                    "You have a new earning of {$earning->net_amount} {$earning->currency} from booking {$bookingReference} for {$clinicName}.",
                    "لديك كسب جديد بقيمة {$earning->net_amount} {$earning->currency} من الحجز {$bookingReferenceAr} لـ {$clinicNameAr}.",
                    [
                        'earning_id' => $earning->id,
                        'booking_id' => $earning->booking_id,
                        'booking_reference' => $booking->booking_reference ?? null,
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'net_amount' => $earning->net_amount,
                        'currency' => $earning->currency,
                        'status' => $earning->status,
                    ],
                    $earning
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send earning created notification", [
                'earning_id' => $earning->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic staff when earning is approved/paid
     */
    public function notifyEarningApproved(\App\Models\ClinicEarning $earning): void
    {
        try {
            $earning->loadMissing(['clinic', 'booking', 'payout']);
            $clinic = $earning->clinic;
            if (!$clinic) {
                return;
            }

            $booking = $earning->booking;
            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';
            $payoutReference = $earning->payout ? $earning->payout->payout_reference : null;
            $bookingReference = $booking ? ($booking->booking_reference ?? 'N/A') : 'N/A';
            $bookingReferenceAr = $booking ? ($booking->booking_reference ?? 'غير متاح') : 'غير متاح';
            $payoutText = $payoutReference ? " Payout reference: {$payoutReference}." : '';
            $payoutTextAr = $payoutReference ? " رقم الدفع: {$payoutReference}." : '';

            // Notify clinic and managers
            $this->notifyClinicAndManagers(
                $clinic,
                'earning_approved',
                "Earning Approved: {$earning->net_amount} {$earning->currency}",
                "تمت الموافقة على الكسب: {$earning->net_amount} {$earning->currency}",
                "Your earning of {$earning->net_amount} {$earning->currency} from booking {$bookingReference} has been approved and paid.{$payoutText}",
                "تمت الموافقة على كسبك بقيمة {$earning->net_amount} {$earning->currency} من الحجز {$bookingReferenceAr} وتم الدفع.{$payoutTextAr}",
                [
                    'earning_id' => $earning->id,
                    'booking_id' => $earning->booking_id,
                    'booking_reference' => $booking->booking_reference ?? null,
                    'payout_id' => $earning->payout_id,
                    'payout_reference' => $payoutReference,
                    'clinic_id' => $clinic->id,
                    'clinic_name_en' => $clinic->name_en,
                    'clinic_name_ar' => $clinic->name_ar,
                    'net_amount' => $earning->net_amount,
                    'currency' => $earning->currency,
                    'status' => $earning->status,
                ],
                $earning
            );
        } catch (\Exception $e) {
            Log::error("Failed to send earning approved notification", [
                'earning_id' => $earning->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic staff when earning is processed/paid
     */
    public function notifyEarningProcessed(\App\Models\ClinicEarning $earning): void
    {
        try {
            $earning->loadMissing(['clinic', 'booking', 'payout']);
            $clinic = $earning->clinic;
            if (!$clinic) {
                return;
            }

            $booking = $earning->booking;
            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';
            $payoutReference = $earning->payout ? $earning->payout->payout_reference : null;
            $bookingReference = $booking ? ($booking->booking_reference ?? 'N/A') : 'N/A';
            $bookingReferenceAr = $booking ? ($booking->booking_reference ?? 'غير متاح') : 'غير متاح';
            $payoutText = $payoutReference ? " Payout reference: {$payoutReference}." : '';
            $payoutTextAr = $payoutReference ? " رقم الدفع: {$payoutReference}." : '';

            // Notify clinic staff (clinic role and clinic_manager role)
            $clinicStaff = $this->getClinicStaff($clinic);
            foreach ($clinicStaff as $staffMember) {
                $this->createAndSendNotification(
                    $staffMember,
                    'earning_processed',
                    "Earning Paid: {$earning->net_amount} {$earning->currency}",
                    "تم دفع الكسب: {$earning->net_amount} {$earning->currency}",
                    "Your earning of {$earning->net_amount} {$earning->currency} from booking {$bookingReference} has been paid.{$payoutText}",
                    "تم دفع كسبك بقيمة {$earning->net_amount} {$earning->currency} من الحجز {$bookingReferenceAr}.{$payoutTextAr}",
                    [
                        'earning_id' => $earning->id,
                        'booking_id' => $earning->booking_id,
                        'booking_reference' => $booking->booking_reference ?? null,
                        'payout_id' => $earning->payout_id,
                        'payout_reference' => $payoutReference,
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'net_amount' => $earning->net_amount,
                        'currency' => $earning->currency,
                        'status' => $earning->status,
                    ],
                    $earning
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send earning processed notification", [
                'earning_id' => $earning->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify super admins when a new clinic is registered
     */
    public function notifyClinicCreated(\App\Models\Clinic $clinic): void
    {
        try {
            $clinic->loadMissing(['owner', 'category']);
            
            $ownerName = $clinic->owner ? $clinic->owner->name : 'Unknown';
            $ownerNameAr = $clinic->owner ? $clinic->owner->name : 'غير معروف';
            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? $clinic->name_en ?? 'عيادة';
            $categoryName = $clinic->category ? ($clinic->category->name_en ?? $clinic->category->name_ar ?? 'Category') : 'N/A';
            $categoryNameAr = $clinic->category ? ($clinic->category->name_ar ?? $clinic->category->name_en ?? 'فئة') : 'غير متاح';

            // Notify all super admins
            $superAdmins = $this->getSuperAdmins();
            foreach ($superAdmins as $admin) {
                $this->createAndSendNotification(
                    $admin,
                    'clinic_registered',
                    "New Clinic Registration: {$clinicName}",
                    "تسجيل عيادة جديدة: {$clinicName}",
                    "A new clinic '{$clinicName}' has been registered by {$ownerName}. Please review and approve.",
                    "تم تسجيل عيادة جديدة '{$clinicNameAr}' بواسطة {$ownerNameAr}. يرجى المراجعة والموافقة.",
                    [
                        'clinic_id' => $clinic->id,
                        'clinic_name_en' => $clinic->name_en,
                        'clinic_name_ar' => $clinic->name_ar,
                        'owner_id' => $clinic->owner_id,
                        'owner_name' => $ownerName,
                        'category_id' => $clinic->category_id,
                        'category_name' => $categoryName,
                        'status' => $clinic->status,
                        'phone' => $clinic->phone,
                        'email' => $clinic->email,
                    ],
                    $clinic
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send clinic created notification", [
                'clinic_id' => $clinic->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic owner when clinic status is changed
     */
    public function notifyClinicStatusChanged(\App\Models\Clinic $clinic, string $oldStatus, string $newStatus): void
    {
        try {
            if (!$clinic->owner) {
                return;
            }

            $clinicNameEn = $clinic->name_en ?? 'Clinic';
            $clinicNameAr = $clinic->name_ar ?? 'عيادة';
            $rejectionReason = $clinic->rejection_reason ?? '';
            
            $statusMessages = [
                'approved' => [
                    'en' => "Your clinic '{$clinicNameEn}' has been approved.",
                    'ar' => "تمت الموافقة على عيادتك '{$clinicNameAr}'.",
                ],
                'rejected' => [
                    'en' => "Your clinic '{$clinicNameEn}' has been rejected." . ($rejectionReason ? " Reason: {$rejectionReason}" : ''),
                    'ar' => "تم رفض عيادتك '{$clinicNameAr}'." . ($rejectionReason ? " السبب: {$rejectionReason}" : ''),
                ],
                'suspended' => [
                    'en' => "Your clinic '{$clinicNameEn}' has been suspended.",
                    'ar' => "تم تعليق عيادتك '{$clinicNameAr}'.",
                ],
            ];

            $statusTranslations = [
                'pending' => ['en' => 'pending', 'ar' => 'قيد الانتظار'],
                'approved' => ['en' => 'approved', 'ar' => 'موافق عليه'],
                'rejected' => ['en' => 'rejected', 'ar' => 'مرفوض'],
                'suspended' => ['en' => 'suspended', 'ar' => 'معلق'],
            ];
            
            $statusAr = $statusTranslations[$newStatus]['ar'] ?? $newStatus;

            $messages = $statusMessages[$newStatus] ?? [
                'en' => "Your clinic status has been changed to {$newStatus}.",
                'ar' => "تم تغيير حالة عيادتك إلى {$statusAr}.",
            ];

            $this->createAndSendNotification(
                $clinic->owner,
                'clinic_status_changed',
                "Clinic Status Changed",
                "تم تغيير حالة العيادة",
                $messages['en'],
                $messages['ar'],
                [
                    'clinic_id' => $clinic->id,
                    'clinic_name_en' => $clinic->name_en,
                    'clinic_name_ar' => $clinic->name_ar,
                    'status' => $newStatus,
                    'old_status' => $oldStatus,
                    'rejection_reason' => $clinic->rejection_reason,
                ],
                $clinic
            );
        } catch (\Exception $e) {
            Log::error("Failed to send clinic status changed notification", [
                'clinic_id' => $clinic->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify clinic and all clinic managers
     */
    public function notifyClinicAndManagers(
        \App\Models\Clinic $clinic,
        string $type,
        string $titleEn,
        string $titleAr,
        string $messageEn,
        string $messageAr,
        array $data = [],
        $notifiable = null
    ): void {
        $clinicStaff = $this->getClinicStaff($clinic);
        foreach ($clinicStaff as $staffMember) {
            $this->createAndSendNotification(
                $staffMember,
                $type,
                $titleEn,
                $titleAr,
                $messageEn,
                $messageAr,
                $data,
                $notifiable
            );
        }
    }

    /**
     * Notify all users with a specific permission
     */
    public function notifyRolesWithPermission(
        string $permission,
        string $type,
        string $titleEn,
        string $titleAr,
        string $messageEn,
        string $messageAr,
        array $data = [],
        $notifiable = null
    ): void {
        try {
            $users = \App\Models\User::permission($permission)->get();
            
            foreach ($users as $user) {
                $this->createAndSendNotification(
                    $user,
                    $type,
                    $titleEn,
                    $titleAr,
                    $messageEn,
                    $messageAr,
                    $data,
                    $notifiable
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to notify users with permission {$permission}", [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify all super admins
     */
    public function notifySuperAdmins(
        string $type,
        string $titleEn,
        string $titleAr,
        string $messageEn,
        string $messageAr,
        array $data = [],
        $notifiable = null
    ): void {
        $superAdmins = $this->getSuperAdmins();
        foreach ($superAdmins as $admin) {
            $this->createAndSendNotification(
                $admin,
                $type,
                $titleEn,
                $titleAr,
                $messageEn,
                $messageAr,
                $data,
                $notifiable
            );
        }
    }

    /**
     * Get user's recipient type based on their roles
     * Must match enum values: ['admins', 'clinics', 'users', 'guests', 'system']
     */
    private function getUserRecipientType(User $user): string
    {
        

        if ($user->hasRole('clinic')) {
            return 'clinics';
        }
        
        // Check for regular user role
        if ($user->hasRole('user')) {
            return 'users';
        }
        
        // Check for guest role
        if ($user->hasRole('guest')) {
            return 'guests';
        }
        
        // All other roles (super-admin, admin, manager, etc.) are treated as admins
        return 'admins';
    }
}


