<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Banner extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'name_en',
        'name_ar',
        'title_en',
        'title_ar',
        'description_en',
        'description_ar',
        'image_url',
        'mobile_image_url',
        'link_url',
        'linkable_type',
        'linkable_id',
        'type',
        'position',
        'sort_order',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'status',
        'click_count',
    ];

    /**
     * The model's default attributes.
     * Set default type to 'homepage' - can be customized in the future if needed
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'type' => 'homepage',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'click_count' => 'integer',
        ];
    }

    /**
     * Get the parent linkable model (polymorphic)
     */
    public function linkable()
    {
        return $this->morphTo();
    }

    /**
     * Get the media for the banner
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Scope for active banners
     * Note: Soft-deleted banners are automatically excluded by Laravel's SoftDeletes trait
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where(function ($q) {
                        $q->whereNull('start_date')
                          ->orWhere('start_date', '<=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                          ->orWhere('end_date', '>=', now());
                    });
    }

    /**
     * Scope for banners by position
     */
    public function scopeByPosition($query, string $position)
    {
        return $query->where('position', $position);
    }

    /**
     * Scope for banners by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for ordered banners
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc');
    }

    /**
     * Get the full URL for the image
     */
    public function getImageUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // Remove leading /storage/ if present to avoid duplication
        $value = ltrim($value, '/');
        if (str_starts_with($value, 'storage/')) {
            $value = substr($value, 8); // Remove 'storage/' prefix
        }

        // Return the storage URL
        return asset('storage/' . $value);
    }

    /**
     * Get the full URL for the mobile image
     */
    public function getMobileImageUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // Otherwise, return the storage URL
        return asset('storage/' . $value);
    }
}