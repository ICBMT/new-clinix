<?php

namespace App\Models;

use App\Traits\LogsActivity;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class BookingSession extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'booking_id',
        'treatment_slot_id',
        'slot_date',
        'slot_time',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'slot_date' => 'date',
            'slot_time' => 'datetime:H:i',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function treatmentSlot(): BelongsTo
    {
        return $this->belongsTo(TreatmentSlot::class);
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        static::updated(function (BookingSession $session) {
            $isStatusChange = $session->isDirty('status');

            if ($isStatusChange && $session->status === 'completed') {
                static::dispatchSessionCompletedNotification($session);
            }
        });
    }

    /**
     * Dispatch notification when session is marked as completed
     */
    protected static function dispatchSessionCompletedNotification(BookingSession $session): void
    {
        try {
            $session->loadMissing(['booking.clinic.owner', 'booking.user']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyBookingSessionCompleted($session);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch session completed notification for Session ID {$session->id}: " . $e->getMessage());
        }
    }
}

