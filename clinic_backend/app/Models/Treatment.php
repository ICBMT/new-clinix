<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Review;

class Treatment extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $table = 'treatments';

    protected $fillable = [
        'clinic_id',
        'category_id',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'preparation_instructions_en',
        'preparation_instructions_ar',
        'aftercare_instructions_en',
        'aftercare_instructions_ar',
        'side_effects_en',
        'side_effects_ar',
        'warnings_en',
        'warnings_ar',
        'base_price',
        'final_price',
        'discount_type',
        'discount_value',
        'has_discount',
        'currency',
        'service_duration_minutes',
        'is_featured',
        'status',
        'rejection_reason',
        'suitable_for_skin_types',
        'suitable_for_conditions',
        'min_age',
        'max_age',
        'gender_restriction',
        'treatment_steps_en',
        'treatment_steps_ar',
        'estimated_recovery_days',
            'sessions_required',
            'max_sessions',
            'sessions_interval_days',
        'video_url',
        'faq',
        'requires_consultation',
        'requires_medical_clearance',
        'popularity_score',
        'featured_until',
        'slug_en',
        'slug_ar',
        'meta_description_en',
        'meta_description_ar',
        'meta_keywords_en',
        'meta_keywords_ar',
        'average_rating',
        'total_reviews',
        'total_bookings',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'final_price' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'has_discount' => 'boolean',
            'service_duration_minutes' => 'integer',
            'is_featured' => 'boolean',
            'average_rating' => 'decimal:2',
            'total_reviews' => 'integer',
            'total_bookings' => 'integer',
            'suitable_for_skin_types' => 'array',
            'suitable_for_conditions' => 'array',
            'treatment_steps_en' => 'array',
            'treatment_steps_ar' => 'array',
            'faq' => 'array',
            'requires_consultation' => 'boolean',
            'requires_medical_clearance' => 'boolean',
            'popularity_score' => 'integer',
            'featured_until' => 'datetime',
            'min_age' => 'integer',
            'max_age' => 'integer',
            'estimated_recovery_days' => 'integer',
            'sessions_required' => 'integer',
            'max_sessions' => 'integer',
            'sessions_interval_days' => 'integer',
        ];
    }

    /**
     * Get the clinic that owns the treatment
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    /**
     * Alias for backward compatibility
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    /**
     * Get the category that owns the treatment
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the bookings for the treatment
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get reviews for the treatment (through bookings)
     */
    public function reviews()
    {
        return $this->hasManyThrough(
            Review::class,
            Booking::class,
            'treatment_id', // Foreign key on bookings table
            'booking_id', // Foreign key on reviews table
            'id', // Local key on treatments table
            'id' // Local key on bookings table
        )->whereNotNull('rating');
    }


    /**
     * Get the machines that support this treatment
     */
    public function machines(): BelongsToMany
    {
        return $this->belongsToMany(Machine::class, 'machine_treatment', 'treatment_id', 'machine_id')
            ->withTimestamps();
    }


    /**
     * Get the time slots for the treatment
     */
    public function slots(): HasMany
    {
        return $this->hasMany(TreatmentSlot::class, 'treatment_id');
    }

    /**
     * Get the weekly schedules for the treatment
     */
    public function weeklySchedules(): HasMany
    {
        return $this->hasMany(TreatmentWeeklySchedule::class, 'treatment_id');
    }

    /**
     * Get the favorites for the treatment (polymorphic)
     */
    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    /**
     * Get the media for the treatment
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get the add-ons for the treatment
     */
    public function addOns(): HasMany
    {
        return $this->hasMany(TreatmentAddOn::class, 'treatment_id');
    }

    /**
     * Scope for active treatments
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for featured treatments
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope for treatments by clinic
     */
    public function scopeByClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }

    /**
     * Alias for backward compatibility
     */
    public function scopeByVendor($query, int $vendorId)
    {
        // For backward compatibility, find clinic by owner_id
        return $query->whereHas('clinic', function ($q) use ($vendorId) {
            $q->where('owner_id', $vendorId);
        });
    }

    /**
     * Scope for treatments by category
     */
    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

}