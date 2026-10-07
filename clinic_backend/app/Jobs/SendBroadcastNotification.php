<?php

namespace App\Jobs;

use App\Models\Broadcast;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Kreait\Firebase\Exception\MessagingException;

class SendBroadcastNotification
{
    use Dispatchable;

    protected $broadcast;

    public function __construct(Broadcast $broadcast)
    {
        $this->broadcast = $broadcast;
    }

    public function handle(): void
    {
        try {
            // Reload broadcast to ensure we have latest data
            $this->broadcast->refresh();
            
            // Resolve services in handle method (not constructor) to avoid serialization issues
            $messaging = app(Messaging::class);
            $notificationService = app(NotificationService::class);
            
            // Send Firebase topic notifications (scalable approach for millions of users)
            $this->sendTopicNotifications($messaging);
            
            // Create notifications in database for all target users (without triggering push notifications)
            // Push notifications are already sent via Firebase topics above
            $this->createDatabaseNotifications($notificationService);

            // Update broadcast status to sent after successful processing
            $this->broadcast->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);
            
            Log::info(__('common.job.broadcast.completed_successfully'), [
                'broadcast_id' => $this->broadcast->id,
                'title_en' => $this->broadcast->getTitle('en'),
                'title_ar' => $this->broadcast->getTitle('ar'),
                'target_roles' => $this->broadcast->target_roles,
                'recipients_count' => count($this->broadcast->recipients ?? []),
                'timestamp' => now()->toDateTimeString(),
            ]);

        } catch (\Throwable $e) {
            Log::error('Error in SendBroadcastNotification job: ' . $e->getMessage(), [
                'broadcast_id' => $this->broadcast->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Create notifications in database for all target users
     */
    private function createDatabaseNotifications(NotificationService $notificationService): void
    {
        try {
            // Get all users based on target roles
            $users = $this->getTargetUsers();
            
            if ($users->isEmpty()) {
                Log::info(__('common.job.broadcast.no_users_found'), [
                    'broadcast_id' => $this->broadcast->id,
                    'target_roles' => $this->broadcast->target_roles
                ]);
                return;
            }

            // Create notifications using NotificationService
            $result = $notificationService->createBroadcastNotifications($this->broadcast, $users);
            
            Log::info("Database notifications created for broadcast", [
                'broadcast_id' => $this->broadcast->id,
                'success_count' => $result['success_count'],
                'error_count' => $result['error_count'],
                'total_users' => $users->count()
            ]);

            // Log any errors
            if ($result['error_count'] > 0) {
                Log::warning(__('common.job.broadcast.notifications_failed_to_create'), [
                    'broadcast_id' => $this->broadcast->id,
                    'errors' => $result['errors']
                ]);
            }

        } catch (\Exception $e) {
            Log::error(__('common.job.broadcast.failed_to_create_database_notifications'), [
                'broadcast_id' => $this->broadcast->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get users based on target roles
     * Filters users based on notification settings (for user role only)
     */
    private function getTargetUsers()
    {
        $users = User::query();
        
        // If specific recipients are provided, use them
        if (!empty($this->broadcast->recipients)) {
            $users->whereIn('id', $this->broadcast->recipients);
        }
        
        // If target roles are provided, filter by roles (excluding vendor)
        if (!empty($this->broadcast->target_roles)) {
            $users->whereHas('roles', function ($query) {
                $query->whereIn('name', $this->broadcast->target_roles);
            });
        }
        
        $allUsers = $users->get();
        
        // Filter users based on notification settings (only for user role)
        // Broadcasts are treated as promotions/offers, so check promotions_offers setting
        $filteredUsers = $allUsers->filter(function ($user) {
            // Only filter users with 'user' role (not admin, clinic, etc.)
            if ($user->hasRole('user') && !$user->hasRole('super-admin')) {
                $settings = $user->notification_settings ?? [];
                // Check if promotions_offers is enabled (default to true if not set)
                $promotionsEnabled = $settings['promotions_offers'] ?? true;
                
                if (!$promotionsEnabled) {
                    Log::info("Filtering out user from broadcast - promotions_offers disabled", [
                        'user_id' => $user->id,
                        'broadcast_id' => $this->broadcast->id,
                    ]);
                    return false;
                }
            }
            return true;
        });
        
        return $filteredUsers;
    }

    private function sendTopicNotifications($messaging): void
    {
        try {
            // Always send to general_announcements topic for all broadcasts
            $this->sendToGeneralAnnouncementsTopic($messaging);
            
            // Also send to role-specific topics if target roles are specified
            if (!empty($this->broadcast->target_roles)) {
                foreach ($this->broadcast->target_roles as $role) {
                    $this->sendToRoleTopic($messaging, $role);
                }
            }

        } catch (\Throwable $e) {
            Log::error(__('common.job.broadcast.error_in_send_topic_notifications') . ': ' . $e->getMessage(), [
                'broadcast_id' => $this->broadcast->id,
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Send broadcast to general_announcements topic
     */
    private function sendToGeneralAnnouncementsTopic($messaging): void
    {
        try {
            $topicName = 'general_announcements';
            
            // Get both EN and AR titles and messages
            $titleEn = $this->broadcast->getTitle('en');
            $titleAr = $this->broadcast->getTitle('ar');
            $messageEn = $this->broadcast->getMessage('en');
            $messageAr = $this->broadcast->getMessage('ar');

            // Create Firebase notification with EN content (default)
            $firebaseNotification = FirebaseNotification::create($titleEn, $messageEn);

            $dataPayload = [
                'notification_id' => (string) $this->broadcast->id,
                'type' => 'admin_broadcast',
                'notifiable_id' => (string) $this->broadcast->id,
                'notifiable_type' => Broadcast::class,
                'recipient_type' => 'all',
                'notification_type' => 'admin_broadcast',
                'broadcast_id' => (string) $this->broadcast->id,
                'sent_by' => (string) $this->broadcast->sent_by,
                'target_roles' => json_encode($this->broadcast->target_roles ?? []),
                'notification_language' => 'en',
                // Include both languages in data payload
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'message_en' => $messageEn,
                'message_ar' => $messageAr,
            ];

            $message = CloudMessage::withTarget('topic', $topicName)
                ->withNotification($firebaseNotification)
                ->withData($dataPayload);

            $messaging->send($message);
            
            Log::info("✅ Broadcast notification sent to general_announcements topic", [
                'broadcast_id' => $this->broadcast->id,
                'topic' => $topicName,
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'message_en' => $messageEn,
                'message_ar' => $messageAr,
                'timestamp' => now()->toDateTimeString(),
            ]);

        } catch (MessagingException $e) {
            Log::error(__('common.job.broadcast.failed_to_send_to_general_announcements'), [
                'broadcast_id' => $this->broadcast->id,
                'topic' => $topicName,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'timestamp' => now()->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            Log::error(__('common.job.broadcast.error_sending_to_general_announcements'), [
                'broadcast_id' => $this->broadcast->id,
                'error' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'timestamp' => now()->toDateTimeString(),
            ]);
        }
    }

    private function sendToRoleTopic($messaging, $role): void
    {
        try {
            $topicName = "role_{$role}";
            
            // Get both EN and AR titles and messages
            $titleEn = $this->broadcast->getTitle('en');
            $titleAr = $this->broadcast->getTitle('ar');
            $messageEn = $this->broadcast->getMessage('en');
            $messageAr = $this->broadcast->getMessage('ar');

            // Create Firebase notification with EN content (default)
            $firebaseNotification = FirebaseNotification::create($titleEn, $messageEn);

            $dataPayload = [
                'notification_id' => (string) $this->broadcast->id,
                'type' => 'admin_broadcast',
                'notifiable_id' => (string) $this->broadcast->id,
                'notifiable_type' => Broadcast::class,
                'recipient_type' => $this->getRecipientTypeForRole($role),
                'notification_type' => 'admin_broadcast',
                'broadcast_id' => (string) $this->broadcast->id,
                'sent_by' => (string) $this->broadcast->sent_by,
                'target_roles' => json_encode($this->broadcast->target_roles),
                'notification_language' => 'en',
                // Include both languages in data payload
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'message_en' => $messageEn,
                'message_ar' => $messageAr,
            ];

            $message = CloudMessage::withTarget('topic', $topicName)
                ->withNotification($firebaseNotification)
                ->withData($dataPayload);

            $messaging->send($message);
            
            Log::info("Broadcast notification sent to topic", [
                'broadcast_id' => $this->broadcast->id,
                'topic' => $topicName,
                'role' => $role,
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'message_en' => $messageEn,
                'message_ar' => $messageAr,
            ]);

        } catch (MessagingException $e) {
            Log::error(__('common.job.broadcast.failed_to_send_to_topic'), [
                'broadcast_id' => $this->broadcast->id,
                'role' => $role,
                'topic' => $topicName,
                'error' => $e->getMessage(),
            ]);
        } catch (\Exception $e) {
            Log::error(__('common.job.broadcast.error_sending_to_role_topic'), [
                'broadcast_id' => $this->broadcast->id,
                'role' => $role,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get recipient type for a role
     */
    private function getRecipientTypeForRole(string $role): string
    {
        switch ($role) {
            case 'vendor':
                return 'vendor';
            case 'user':
                return 'user';
            case 'guest':
                return 'guest';
            default:
                return 'admin'; // All other roles (super-admin, admin, manager, etc.)
        }
    }
}
