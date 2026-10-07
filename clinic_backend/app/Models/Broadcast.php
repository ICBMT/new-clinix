<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;

class Broadcast extends Model
{
    use HasFactory, LogsActivity;
    protected $fillable = [
        'title_en',
        'title_ar',
        'description_en',
        'description_ar',
        'recipients',
        'target_roles',
        'scheduled_at',
        'sent_at',
        'sent_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'recipients' => 'array',
            'target_roles' => 'array',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    /**
     * Get the user who sent the broadcast
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
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
     * Scope for pending broadcasts
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for sent broadcasts
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Dispatch notification when broadcast is created
        static::created(function (Broadcast $broadcast) {
            static::dispatchBroadcastCreatedNotification($broadcast);
        });
    }

    /**
     * Dispatch notification when broadcast is created
     */
    protected static function dispatchBroadcastCreatedNotification(Broadcast $broadcast): void
    {
        try {
            // Broadcast notifications are handled by SendBroadcastNotification job
            // This is just a placeholder in case we need to notify admins about broadcast creation
            Log::info("Broadcast created", [
                'broadcast_id' => $broadcast->id,
                'title_en' => $broadcast->title_en,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch broadcast created notification for Broadcast ID {$broadcast->id}: " . $e->getMessage());
        }
    }
}
