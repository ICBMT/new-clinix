<?php

namespace App\Models;

use App\Traits\LogsActivity;
use App\Services\FirebaseTopicService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;

class DeviceToken extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id', 
        'token', 
        'type'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create or update a device token for a user.
     * Ensures only one token per user per type (prevents duplicates).
     * If a token already exists for the user and type, it will be updated with the new token value.
     */
    public static function createOrUpdateForUser($user, string $token, string $type = 'fcm'): self
    {
        $userId = is_object($user) ? $user->id : $user;
        
        return self::updateOrCreate(
            [
                'user_id' => $userId,
                'type' => $type,
            ],
            [
                'token' => $token,
            ]
        );
    }

    /**
     * Delete device token for a user.
     */
    public static function deleteForUser($user, ?string $token = null): bool
    {
        $query = self::where('user_id', $user->id);
        
        if ($token) {
            $query->where('token', $token);
        }
        
        return $query->delete() > 0;
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // When a device token is created or updated, subscribe the user to topics
        static::created(function ($deviceToken) {
            try {
                $firebaseService = app(FirebaseTopicService::class);
                $firebaseService->subscribeUserToTopics($deviceToken->user);
            } catch (\Exception $e) {
                Log::error('Failed to subscribe user to topics after device token creation: ' . $e->getMessage());
            }
        });

        // Also subscribe when token is updated (in case it was updated instead of created)
        static::updated(function ($deviceToken) {
            try {
                // Only subscribe if token value changed (not just updated_at)
                if ($deviceToken->wasChanged('token')) {
                    $firebaseService = app(FirebaseTopicService::class);
                    $firebaseService->subscribeUserToTopics($deviceToken->user);
                }
            } catch (\Exception $e) {
                Log::error('Failed to subscribe user to topics after device token update: ' . $e->getMessage());
            }
        });

        // When a device token is deleted, unsubscribe the user from topics
        static::deleted(function ($deviceToken) {
            try {
                $firebaseService = app(FirebaseTopicService::class);
                $firebaseService->unsubscribeUserFromTopics($deviceToken->user);
            } catch (\Exception $e) {
                Log::error('Failed to unsubscribe user from topics after device token deletion: ' . $e->getMessage());
            }
        });
    }
}


