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

class Machine extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'clinic_id',
        'category_id',
        'serial_number',
        'model_en',
        'model_ar',
        'manufacturer_en',
        'manufacturer_ar',
        'image',
        'status',
        'request_status',
        'requested_by_clinic_id',
        'rejection_reason',
        'description_en',
        'description_ar',
    ];

    protected function casts(): array
    {
        return [
            //
        ];
    }

    /**
     * Get the category for the machine (backward compatibility - single category)
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the categories for the machine (many-to-many)
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'machine_category', 'machine_id', 'category_id')
            ->withTimestamps();
    }

    /**
     * Get the clinic that requested this machine
     */
    public function requestedByClinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'requested_by_clinic_id');
    }

    /**
     * Get the clinic that owns the machine
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
        // Return clinic owner as vendor for backward compatibility
        return $this->belongsTo(User::class, 'vendor_id');
    }

    /**
     * Get the treatments that this machine supports
     */
    public function treatments(): BelongsToMany
    {
        return $this->belongsToMany(Treatment::class, 'machine_treatment', 'machine_id', 'treatment_id')
            ->withTimestamps();
    }

    /**
     * Get the bookings for this machine
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get the media for the machine
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get reviews for the machine (through bookings)
     */
    public function reviews()
    {
        return $this->hasManyThrough(
            Review::class,
            Booking::class,
            'machine_id', // Foreign key on bookings table
            'booking_id', // Foreign key on reviews table
            'id', // Local key on machines table
            'id' // Local key on bookings table
        )->whereNotNull('rating');
    }

    /**
     * Get favorites for the machine (polymorphic)
     */
    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    /**
     * Scope for ready machines
     */
    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }

    /**
     * Scope for machines by vendor
     */
    public function scopeByVendor($query, int $vendorId)
    {
        return $query->where('vendor_id', $vendorId);
    }

    /**
     * Scope for machines by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Convert a storage path to a full URL
     * 
     * @param string|null $path The storage path (e.g., '/storage/machines/image.jpg' or 'machines/image.jpg')
     * @return string|null The full URL or null if path is empty
     */
    public static function getStorageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        // Remove leading slashes and 'storage/' prefix to avoid duplication
        $path = ltrim($path, '/');
        
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8); // Remove 'storage/' prefix
        }

        // Return the full URL using asset() helper
        return asset('storage/' . $path);
    }

    /**
     * Get the full URL for the machine image
     * This accessor converts storage paths to full URLs
     */
    public function getImageUrlAttribute(): ?string
    {
        // First, try to get image from media relationship
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $imageMedia = $this->media
                ->where('collection_name', 'images')
                ->sortByDesc('created_at')
                ->first();
            
            if ($imageMedia && $imageMedia->file_name) {
                return static::getStorageUrl($imageMedia->file_name);
            }
            
            // If no image in 'images' collection, use first media item
            $firstMedia = $this->media->first();
            if ($firstMedia && $firstMedia->file_name) {
                return static::getStorageUrl($firstMedia->file_name);
            }
        }

        // Fallback to the image field in the database
        $imagePath = $this->attributes['image'] ?? null;
        if (!$imagePath) {
            return null;
        }

        return static::getStorageUrl($imagePath);
    }

    /**
     * Get image URL from media collection
     * Helper method to get the first image from media collection
     */
    public function getImageFromMedia(): ?string
    {
        $imageMedia = $this->media()
            ->where('collection_name', 'images')
            ->orderBy('created_at', 'desc')
            ->first();
        
        if ($imageMedia && $imageMedia->file_name) {
            return static::getStorageUrl($imageMedia->file_name);
        }

        // Fallback to image field
        return $this->image_url;
    }
}
