<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SubscriptionPackage extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'price',
        'currency',
        'billing_cycle',
        'duration_days',
        'features',
        'max_services',
        'max_bookings_per_month',
        'max_machines',
        'max_treatments',
        'document_storage_gb',
        'file_size_limit_mb',
        'featured_listing',
        'priority_support',
        'analytics_access',
        'basic_reports',
        'advanced_reports',
        'custom_branding',
        'banner_slots_per_month',
        'featured_clinic_listings',
        'featured_treatment_slots',
        'featured_machine_slots',
        'support_tier',
        'training_sessions',
        'custom_domain',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'string',
            'duration_days' => 'integer',
            'features' => 'array',
            'max_services' => 'integer',
            'max_bookings_per_month' => 'integer',
            'max_machines' => 'integer',
            'max_treatments' => 'integer',
            'document_storage_gb' => 'integer',
            'file_size_limit_mb' => 'integer',
            'featured_listing' => 'boolean',
            'priority_support' => 'boolean',
            'analytics_access' => 'boolean',
            'basic_reports' => 'boolean',
            'advanced_reports' => 'boolean',
            'custom_branding' => 'boolean',
            'banner_slots_per_month' => 'integer',
            'featured_clinic_listings' => 'integer',
            'featured_treatment_slots' => 'integer',
            'featured_machine_slots' => 'integer',
            'training_sessions' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the clinic subscriptions for this package
     */
    public function clinicSubscriptions(): HasMany
    {
        return $this->hasMany(ClinicSubscription::class);
    }

    /**
     * Alias for clinicSubscriptions relationship
     */
    public function subscriptions(): HasMany
    {
        return $this->clinicSubscriptions();
    }

    /**
     * Get the media for the subscription package
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Scope for active packages
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for inactive packages
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope for ordered packages
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc');
    }

    /**
     * Scope for featured packages
     */
    public function scopeFeatured($query)
    {
        return $query->where('featured_listing', true);
    }
}