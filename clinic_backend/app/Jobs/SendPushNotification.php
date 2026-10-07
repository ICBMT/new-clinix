<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Kreait\Firebase\Exception\MessagingException;
use Illuminate\Support\Arr;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $notificationId;
    protected $recipientId;
    public $tries = 3;

    public function __construct(int $notificationId, int $recipientId)
    {
        $this->notificationId = $notificationId;
        $this->recipientId = $recipientId;
    }

    public function handle(): void
    {
        try {
            Log::info("SendPushNotification job started", [
                'notification_id' => $this->notificationId,
                'recipient_id' => $this->recipientId,
            ]);

            // Reload models from database to avoid serialization issues
            $notification = Notification::findOrFail($this->notificationId);
            $recipient = User::findOrFail($this->recipientId);
            
            // Get messaging service in handle method, not constructor
            $messaging = app(Messaging::class);
            
            // Skip push notifications for vendor users
            if ($notification->recipient_type === 'vendor' || $recipient->hasRole('vendor')) {
                Log::info(__('common.job.push.skipping_for_vendor_user'), [
                    'notification_id' => $notification->id,
                    'recipient_id' => $recipient->id,
                    'recipient_type' => $notification->recipient_type,
                ]);
                return;
            }

            // Check user notification settings (only for user role)
            if ($recipient->hasRole('user') && !$recipient->hasRole('super-admin')) {
                $settings = $recipient->notification_settings ?? [];
                $type = $notification->type ?? 'info';
                
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
                    Log::info(__('common.job.push.skipping_notification_type_disabled'), [
                        'notification_id' => $notification->id,
                        'recipient_id' => $recipient->id,
                        'type' => $type,
                        'setting_key' => $settingKey,
                    ]);
                    return;
                }
            }

            $deviceTokens = $recipient->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            Log::info("Device tokens retrieved for push notification", [
                'notification_id' => $notification->id,
                'recipient_id' => $recipient->id,
                'device_tokens_count' => count($deviceTokens),
                'device_token_types' => $recipient->deviceTokens()->pluck('type')->unique()->toArray(),
            ]);
            
            if (empty($deviceTokens)) {
                Log::warning(__('common.job.push.no_valid_device_tokens') . ": User ID {$recipient->id}, Notification ID {$notification->id}", [
                    'user_id' => $recipient->id,
                    'notification_id' => $notification->id,
                    'total_device_tokens' => $recipient->deviceTokens()->count(),
                ]);
                return;
            }

            $locale = $recipient->default_language ?? config('app.fallback_locale', 'en');

            $title = $notification->getTitle($locale);
            $body = $notification->getMessage($locale);

            $firebaseNotification = FirebaseNotification::create($title, $body);

            $recipient->loadMissing('media');
            $dataPayload = [
                'user' => $recipient->toJson(),
                'notification_id' => (string) $notification->id,
                'type' => (string) $notification->type,
                'notifiable_id' => (string) $notification->notifiable_id,
                'notifiable_type' => (string) $notification->notifiable_type,
            ];
            if (is_array($notification->data)) {
                $dataPayload = array_merge($dataPayload, array_map('strval', $notification->data));
            } elseif (is_string($notification->data)) {
                $decodedData = json_decode($notification->data, true);
                if (is_array($decodedData)) {
                    $dataPayload = array_merge($dataPayload, array_map('strval', $decodedData));
                }
            }
            Log::info("Data payload: " . json_encode($dataPayload));

            $message = CloudMessage::new()
                ->withNotification($firebaseNotification)
                ->withData($dataPayload);

            $report = $messaging->sendMulticast($message, $deviceTokens);

            $successfulSends = $report->successes()->count();
            $failedSends = $report->failures()->count();
            
            if ($successfulSends > 0) {
                Log::info(__('common.job.push.sent_successfully'), [
                    'notification_id' => $notification->id,
                    'recipient_id' => $recipient->id,
                    'successful_sends' => $successfulSends,
                    'failed_sends' => $failedSends,
                    'total_tokens' => count($deviceTokens),
                ]);
            }

            if ($failedSends > 0) {
                Log::warning(__('common.job.push.some_notifications_failed'), [
                    'notification_id' => $notification->id,
                    'recipient_id' => $recipient->id,
                    'successful_sends' => $successfulSends,
                    'failed_sends' => $failedSends,
                    'failed_tokens_details' => $this->getFailedTokenDetails($report),
                ]);
            }
            
            if ($successfulSends === 0 && $failedSends === 0) {
                Log::warning(__('common.job.push.no_notifications_sent'), [
                    'notification_id' => $notification->id,
                    'recipient_id' => $recipient->id,
                    'device_tokens_count' => count($deviceTokens),
                ]);
            }
        } catch (MessagingException $e) {
            Log::error(__('common.job.push.firebase_messaging_exception'), [
                'notification_id' => $this->notificationId,
                'user_id' => $this->recipientId,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'trace' => $e->getTraceAsString(),
            ]);
        } catch (\Throwable $e) {
            Log::error(__('common.job.push.generic_exception'), [
                'notification_id' => $this->notificationId,
                'user_id' => $this->recipientId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    private function getFailedTokenDetails(\Kreait\Firebase\Messaging\MulticastSendReport $report): array
    {
        $details = [];
        foreach ($report->failures()->getItems() as $failure) {
            $details[$failure->target()->value()] = $failure->error()->getMessage();
        }
        return $details;
    }
}


