<?php

namespace App\Models;

use App\Traits\LogsActivity;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;

class Review extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $table = 'reviews';

    protected $fillable = [
        'booking_id',
        'user_id',
        'clinic_id',
        'treatment_id',
        'rating',
        'comment',
        'would_recommend',
        'status',
        'rejection_reason',
        'additional_data',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'would_recommend' => 'boolean',
            'additional_data' => 'array',
        ];
    }


    /**
     * Get the booking that this review belongs to
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the clinic that this review belongs to
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Get the treatment that this review belongs to
     */
    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    /**
     * Get the user that wrote the review
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for reviews by rating
     */
    public function scopeByRating($query, int $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($review) {
            if (!$review->status) {
                $review->status = 'approved';
            }
        });

        static::created(function (Review $review) {
            static::dispatchReviewCreatedNotification($review);
        });
    }

    /**
     * Dispatch notification when review is created
     */
    protected static function dispatchReviewCreatedNotification(Review $review): void
    {
        try {
            $review->loadMissing(['booking.clinic.owner', 'user', 'clinic.owner']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyReviewCreated($review);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch review created notification for Review ID {$review->id}: " . $e->getMessage());
        }
    }
}

