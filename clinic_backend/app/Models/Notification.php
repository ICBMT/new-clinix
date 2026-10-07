<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use App\Jobs\SendPushNotification;

class Notification extends Model
{
    use HasFactory, LogsActivity;
    protected $fillable = [
        'title_en',
        'title_ar',
        'description_en',
        'description_ar',
        'recipient_type',
        'recipient_id',
        'is_read',
        'type',
        'audience',
        'delivery_method',
        'scheduled_at',
        'status',
        'image_url',
        'notifiable_id',
        'notifiable_type',
        'data',
        'broadcast_id',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'data' => 'array',
            'scheduled_at' => 'datetime',
        ];
    }

    /**
     * Get the recipient user
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Get the broadcast associated with this notification
     */
    public function broadcast(): BelongsTo
    {
        return $this->belongsTo(Broadcast::class);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): bool
    {
        return $this->update(['is_read' => true]);
    }

    /**
     * Get localized title based on locale
     */
    public function getTitle($locale = 'en'): string
    {
        return $locale === 'ar' ? $this->title_ar : $this->title_en;
    }

    /**
     * Get localized message based on locale
     */
    public function getMessage($locale = 'en'): string
    {
        return $locale === 'ar' ? ($this->description_ar ?? '') : ($this->description_en ?? '');
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for read notifications
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope by recipient type
     */
    public function scopeByRecipientType($query, $type)
    {
        return $query->where('recipient_type', $type);
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Dispatch push notification job when notification is created
        static::created(function (Notification $notification) {
            static::dispatchPushNotification($notification);
        });
    }

    /**
     * Dispatch push notification job
     */
    protected static function dispatchPushNotification(Notification $notification): void
    {
        try {
            // Skip push notifications for admin_broadcast type
            // These are already sent via Firebase topics in SendBroadcastNotification job
            // We only need to create database records for history/display purposes
            if ($notification->type === 'admin_broadcast') {
                Log::info("Skipping push notification for admin_broadcast - already sent via Firebase topics", [
                    'notification_id' => $notification->id,
                    'broadcast_id' => $notification->broadcast_id,
                ]);
                return;
            }
            
            // Load recipient relationship
            $notification->loadMissing('recipient');
            
            if (!$notification->recipient) {
                Log::warning("Cannot dispatch push notification for Notification ID {$notification->id}: Recipient not found.");
                return;
            }

            // Skip notifications for vendor recipient type or users with vendor role
            if ($notification->recipient_type === 'vendor' || $notification->recipient->hasRole('vendor')) {
                Log::info("Skipping push notification for vendor user", [
                    'notification_id' => $notification->id,
                    'recipient_id' => $notification->recipient_id,
                    'recipient_type' => $notification->recipient_type,
                ]);
                return;
            }

            // Check if notifications are disabled for this user
            $user = $notification->recipient;
            $type = $notification->type ?? 'info';
            
            // For clinic role users, check clinic's email_notifications_enabled setting
            if ($user->hasRole('clinic')) {
                $clinic = $user->ownedClinics()->first();
                if ($clinic && isset($clinic->email_notifications_enabled) && !$clinic->email_notifications_enabled) {
                    Log::info("Skipping push notification - notifications disabled for clinic", [
                        'notification_id' => $notification->id,
                        'recipient_id' => $notification->recipient_id,
                        'clinic_id' => $clinic->id,
                    ]);
                    return;
                }
            }
            
            // For clinic_manager role, check if they're associated with a clinic that has notifications disabled
            if ($user->hasRole('clinic_manager')) {
                $clinic = $user->clinics()->first();
                if ($clinic && isset($clinic->email_notifications_enabled) && !$clinic->email_notifications_enabled) {
                    Log::info("Skipping push notification - notifications disabled for clinic manager's clinic", [
                        'notification_id' => $notification->id,
                        'recipient_id' => $notification->recipient_id,
                        'clinic_id' => $clinic->id,
                    ]);
                    return;
                }
            }
            
            // For regular users, check notification_settings
            if ($user->hasRole('user')) {
                $settings = $user->notification_settings ?? [];
                
                // Map notification types to settings keys
                $typeMapping = [
                    'booking_created' => 'appointment_reminders',
                    'booking_status_updated' => 'reschedule_alerts',
                    'booking_status_changed' => 'reschedule_alerts',
                    'booking_confirmed' => 'appointment_reminders',
                    'booking_cancelled' => 'reschedule_alerts',
                    'booking_rejected' => 'reschedule_alerts',
                    'booking_completed' => 'appointment_reminders',
                    'payment_confirmed' => 'payment_confirmations',
                    'payment_successful' => 'payment_confirmations',
                    'review_requested' => 'review_requests',
                    'review_reminder' => 'review_requests',
                    'promo' => 'promotions_offers',
                    'promotion' => 'promotions_offers',
                    'special_offer' => 'special_offers',
                    'admin_broadcast' => 'promotions_offers', // Broadcasts are treated as promotions/offers
                ];
                
                $settingKey = $typeMapping[$type] ?? null;
                if ($settingKey && isset($settings[$settingKey]) && !$settings[$settingKey]) {
                    Log::info("Skipping push notification - notification type disabled in user settings", [
                        'notification_id' => $notification->id,
                        'recipient_id' => $notification->recipient_id,
                        'type' => $type,
                        'setting_key' => $settingKey,
                    ]);
                    return;
                }
            }

            // Dispatch the push notification job to database queue
            SendPushNotification::dispatch($notification->id, $notification->recipient->id);
            
            Log::info("Push notification job dispatched to queue", [
                'notification_id' => $notification->id,
                'recipient_id' => $notification->recipient_id,
                'type' => $notification->type,
                'queue_connection' => config('queue.default', 'database'),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch push notification for Notification ID {$notification->id}: " . $e->getMessage());
        }
    }
}
