<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;

class Favorite extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id',
        'favoritable_type',
        'favoritable_id',
    ];

    /**
     * Get the user that favorited the service
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent favoritable model (polymorphic)
     */
    public function favoritable()
    {
        return $this->morphTo();
    }

    /**
     * Scope for favorites by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for favorites by favoritable type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('favoritable_type', $type);
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function (Favorite $favorite) {
            static::dispatchFavoriteCreatedNotification($favorite);
        });
    }

    /**
     * Dispatch notification when favorite is created
     */
    protected static function dispatchFavoriteCreatedNotification(Favorite $favorite): void
    {
        try {
            $favorite->loadMissing(['user', 'favoritable']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyClinicFavorited($favorite);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch favorite created notification for Favorite ID {$favorite->id}: " . $e->getMessage());
        }
    }
}