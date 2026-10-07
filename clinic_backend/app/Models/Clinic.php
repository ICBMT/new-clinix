<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use App\Traits\LogsActivity;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;

class Clinic extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'clinics';

    protected $fillable = [
        'owner_id',
        'category_id',
        'name_en',
        'name_ar',
        'address',
        'phone',
        'email',
        'logo',
        'bio_en',
        'bio_ar',
        'status',
        'rejection_reason',
        'approved_at',
        'governorate_id',
        'area_id',
        'block',
        'street',
        'avenue',
        'house',
        'floor',
        'apt',
        'city',
        'state',
        'country',
        'postal_code',
        'latitude',
        'longitude',
        'average_rating',
        'total_reviews',
        'total_bookings',
        'is_featured',
        'auto_confirm_bookings',
        'new_booking_alerts',
        'cancellation_alerts',
        'review_alerts',
        'email_notifications_enabled',
        'notification_email',
        'default_language',
        'rtl_override',
        'cancellation_policy_en',
        'cancellation_policy_ar',
        'rescheduling_policy_en',
        'rescheduling_policy_ar',
        'reschedule_policy_en',
        'reschedule_policy_ar',
        'privacy_policy_en',
        'privacy_policy_ar',
        'terms_and_conditions_en',
        'terms_and_conditions_ar',
        'refund_policy_en',
        'refund_policy_ar',
        'rescheduling_buffer_hours',
        'cancellation_buffer_hours',
        'refund_policy_type',
        'refund_policy_percentage',
        'subscription_id',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'average_rating' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'is_featured' => 'boolean',
            'auto_confirm_bookings' => 'boolean',
            'new_booking_alerts' => 'boolean',
            'cancellation_alerts' => 'boolean',
            'review_alerts' => 'boolean',
            'email_notifications_enabled' => 'boolean',
            'rtl_override' => 'boolean',
            'rescheduling_buffer_hours' => 'integer',
            'cancellation_buffer_hours' => 'integer',
            'refund_policy_percentage' => 'decimal:2',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Alias for backward compatibility
     */
    public function user(): BelongsTo
    {
        return $this->owner();
    }

    /**
     * Get the category for the clinic
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the governorate for the clinic
     */
    public function governorate(): BelongsTo
    {
        return $this->belongsTo(Governorate::class);
    }

    /**
     * Get the area for the clinic
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get all users (staff/managers) associated with this clinic
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'clinic_users', 'clinic_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Get operating hours for the clinic
     */
    public function operatingHours(): HasMany
    {
        return $this->hasMany(ClinicOperatingHour::class);
    }

    /**
     * Get subscriptions for the clinic
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(ClinicSubscription::class);
    }

    /**
     * Get active subscription for the clinic
     */
    public function activeSubscription(): BelongsTo
    {
        return $this->belongsTo(ClinicSubscription::class, 'subscription_id');
    }

    /**
     * Get earnings for the clinic
     */
    public function earnings(): HasMany
    {
        return $this->hasMany(ClinicEarning::class);
    }

    /**
     * Get payouts for the clinic
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(ClinicPayout::class);
    }

    /**
     * Get reviews for the clinic
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'clinic_id');
    }

    /**
     * Get favorites for the clinic (polymorphic)
     */
    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function images(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('collection_name', 'images');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('collection_name', 'documents');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeByCity($query, $city)
    {
        return $query->where('city', $city);
    }

    public function scopeByArea($query, $areaId)
    {
        return $query->where('area_id', $areaId);
    }

    public function scopeByRating($query)
    {
        return $query->orderBy('average_rating', 'desc');
    }

    /**
     * Get treatment weekly schedules for this clinic
     */
    public function treatmentWeeklySchedules(): HasMany
    {
        return $this->hasMany(TreatmentWeeklySchedule::class, 'clinic_id');
    }

    /**
     * Get treatments for this clinic
     */
    public function treatments(): HasMany
    {
        return $this->hasMany(Treatment::class, 'clinic_id');
    }


    /**
     * Get machines for this clinic
     */
    public function machines(): HasMany
    {
        return $this->hasMany(Machine::class, 'clinic_id');
    }

    /**
     * Get bookings for this clinic
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'clinic_id');
    }

    /**
     * Scope for clinics owned by user
     */
    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('owner_id', $userId);
    }

    /**
     * Scope for clinics where user is a member
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('owner_id', $userId)
            ->orWhereHas('users', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isFeatured(): bool
    {
        return $this->is_featured;
    }

    public function isVendorProfile(): bool
    {
        return $this->user->hasRole('vendor');
    }

    public function getDefaultLanguage(): string
    {
        return $this->default_language ?? config('app.locale', 'en');
    }

    public function updateAverageRating(): void
    {
        if ($this->isVendorProfile()) {
            $this->average_rating = $this->user->vendorReviews()->avg('rating') ?? 0.00;
            $this->total_reviews = $this->user->vendorReviews()->count();
            $this->save();
        }
    }

    public function updateTotalBookings(): void
    {
        if ($this->isVendorProfile()) {
            $this->total_bookings = $this->user->vendorBookings()->count();
            $this->save();
        }
    }

    public function getFullAddress(): string
    {
        $addressParts = array_filter([
            $this->address,
            $this->block,
            $this->street,
            $this->avenue,
            $this->house,
            $this->floor,
            $this->apt,
            $this->city,
            $this->state,
            $this->country,
        ]);

        return implode(', ', $addressParts);
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Dispatch notification when clinic is created
        static::created(function (Clinic $clinic) {
            static::dispatchClinicCreatedNotification($clinic);
        });

        // Dispatch notification when clinic status changes
        static::updated(function (Clinic $clinic) {
            if ($clinic->isDirty('status')) {
                $oldStatus = $clinic->getOriginal('status');
                $newStatus = $clinic->status;
                
                if ($newStatus === 'approved' && $oldStatus !== 'approved') {
                    static::dispatchClinicApprovedNotification($clinic, $oldStatus);
                } elseif ($newStatus === 'rejected' && $oldStatus !== 'rejected') {
                    static::dispatchClinicRejectedNotification($clinic, $oldStatus);
                }
            }
        });
    }

    /**
     * Dispatch notification when clinic is created
     */
    protected static function dispatchClinicCreatedNotification(Clinic $clinic): void
    {
        try {
            $clinic->loadMissing(['owner', 'category']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyClinicCreated($clinic);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch clinic created notification for Clinic ID {$clinic->id}: " . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when clinic is approved
     */
    protected static function dispatchClinicApprovedNotification(Clinic $clinic, string $oldStatus): void
    {
        try {
            $clinic->loadMissing(['owner']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyClinicStatusChanged($clinic, $oldStatus, 'approved');
        } catch (\Exception $e) {
            Log::error("Failed to dispatch clinic approved notification for Clinic ID {$clinic->id}: " . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when clinic is rejected
     */
    protected static function dispatchClinicRejectedNotification(Clinic $clinic, string $oldStatus): void
    {
        try {
            $clinic->loadMissing(['owner']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyClinicStatusChanged($clinic, $oldStatus, 'rejected');
        } catch (\Exception $e) {
            Log::error("Failed to dispatch clinic rejected notification for Clinic ID {$clinic->id}: " . $e->getMessage());
        }
    }
}



