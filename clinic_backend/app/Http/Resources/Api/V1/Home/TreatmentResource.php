<?php

namespace App\Http\Resources\Api\V1\Home;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class TreatmentResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        $basePrice = $this->base_price ? (float) $this->base_price : 0;
        $finalPrice = $this->final_price ? (float) $this->final_price : $basePrice;
        $price = $finalPrice > 0 ? $finalPrice : $basePrice;

        // Calculate discount - only show discount if treatment is active (approved)
        $isActive = $this->status === 'approved';
        $hasDiscount = false;
        $discountType = null;
        $discountValue = null;
        $discountPercentage = 0;
        $originalPrice = $this->base_price ? (float) $this->base_price : null;

        // Only calculate discount if treatment is active and has_discount is enabled
        if ($isActive && ($this->has_discount ?? false)) {
            $hasDiscount = true;
            $discountType = $this->discount_type ?? null;
            $discountValue = $this->discount_value ? (float) $this->discount_value : null;
            
            if ($discountType && $discountValue && $originalPrice) {
                if ($discountType === 'percentage') {
                    $discountPercentage = round($discountValue, 2);
                } elseif ($discountType === 'fixed') {
                    // Calculate percentage from fixed discount
                    $discountPercentage = round(($discountValue / $originalPrice) * 100, 2);
                }
            } elseif ($this->final_price && $this->base_price && $this->final_price < $this->base_price) {
                // Fallback: calculate from price difference if discount fields not set
                $discountPercentage = round((($this->base_price - $this->final_price) / $this->base_price) * 100);
            }
        }

        return [
            'id' => $this->id,
            'clinic_id' => $this->clinic_id,
            'category_id' => $this->category_id,
            'name' => $this->localized('name'),
            'description' => $this->localized('description'),
            'image' => $this->getImageFromMedia(),
            'image_url' => $this->getImageFromMedia(),
            'base_price' => $this->base_price ? (float) $this->base_price : null,
            'final_price' => $this->final_price ? (float) $this->final_price : null,
            'price' => $price > 0 ? (string) number_format($price, 2, '.', '') : null,
            'original_price' => $hasDiscount ? $originalPrice : null,
            'has_discount' => $hasDiscount,
            'discount_type' => $hasDiscount ? $discountType : null,
            'discount_value' => $hasDiscount ? $discountValue : null,
            'discount_percentage' => $hasDiscount ? $discountPercentage : 0,
            'currency' => $this->currency,
            'service_duration_minutes' => $this->service_duration_minutes ?? 60,
            'is_featured' => $this->is_featured ?? false,
            'status' => $this->status,
            'average_rating' => $this->average_rating ? (float) $this->average_rating : 0.0,
            'total_reviews' => $this->total_reviews ?? 0,
            'total_bookings' => $this->total_bookings ?? 0,
            'is_favorite' => $this->isFavorite($request, 'treatment'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'clinic' => $this->whenLoaded('clinic', function () use ($request) {
                if (!$this->clinic) {
                    return null;
                }

                // Check if logged-in user has any bookings with this clinic
                $user = $request->user();
                $hasBooking = $this->userHasBooking($user, $this->clinic->id);

                // If user has booking, ensure all necessary clinic fields are loaded
                $clinic = $this->clinic;
                if ($hasBooking && $clinic) {
                    // Check if clinic was loaded with limited fields (only id,name_en,name_ar)
                    // If so, we need to reload with all fields
                    // Check by seeing if address attribute exists in the model's attributes
                    $attributes = $clinic->getAttributes();
                    $hasLimitedFields = count($attributes) <= 3 && 
                                       isset($attributes['id']) && 
                                       (isset($attributes['name_en']) || isset($attributes['name_ar']));
                    
                    // Also check if critical fields are missing
                    $missingFields = !isset($attributes['address']) || 
                                    !isset($attributes['phone']) || 
                                    !isset($attributes['email']) ||
                                    !isset($attributes['latitude']) ||
                                    !isset($attributes['longitude']);
                    
                    if ($hasLimitedFields || $missingFields) {
                        // Reload clinic with all necessary fields from database
                        $reloadedClinic = \App\Models\Clinic::with([
                            'area:id,name_en,name_ar',
                            'governorate:id,name_en,name_ar',
                            'owner:id,name,email,status',
                        ])->find($clinic->id);
                        if ($reloadedClinic) {
                            $clinic = $reloadedClinic;
                            /** @phpstan-ignore-next-line */
                            $this->clinic = $reloadedClinic;
                        }
                    } else {
                        // Ensure relationships are loaded if not already
                        if (!$clinic->relationLoaded('area') && $clinic->area_id) {
                            $clinic->load('area:id,name_en,name_ar');
                        }
                        if (!$clinic->relationLoaded('governorate') && $clinic->governorate_id) {
                            $clinic->load('governorate:id,name_en,name_ar');
                        }
                        if (!$clinic->relationLoaded('owner') && $clinic->owner_id) {
                            $clinic->load('owner:id,name,email,status');
                        }
                    }
                } else {
                    // When no booking, only ensure area is loaded if needed
                    if ($clinic && !$clinic->relationLoaded('area') && $clinic->area_id) {
                        $clinic->load('area:id,name_en,name_ar');
                    }
                    if ($clinic && !$clinic->relationLoaded('governorate') && $clinic->governorate_id) {
                        $clinic->load('governorate:id,name_en,name_ar');
                    }
                }

                // Get clinic logo - try from media first, then fallback to logo field
                $clinicLogo = null;
                if ($this->clinic->relationLoaded('media') && $this->clinic->media->isNotEmpty()) {
                    $logoMedia = $this->clinic->media->where('collection_name', 'logos')->first();
                    if ($logoMedia) {
                        $clinicLogo = $logoMedia->file_name ?? $logoMedia->url ?? null;
                    }
                }
                
                if (!$clinicLogo) {
                    $clinicLogo = $this->clinic->logo;
                }

                // Format logo URL
                if ($clinicLogo) {
                    if (str_starts_with($clinicLogo, 'http://') || str_starts_with($clinicLogo, 'https://')) {
                        // Already a full URL
                    } else {
                        $clinicLogo = asset('storage/' . ltrim($clinicLogo, '/'));
                    }
                }

                // Calculate distance if user location is available
                $distance = null;
                if ($this->clinic->latitude && $this->clinic->longitude) {
                    $userLatitude = $request->input('latitude');
                    $userLongitude = $request->input('longitude');
                    
                    if ($userLatitude && $userLongitude) {
                        $distance = $this->calculateDistance(
                            (float) $userLatitude,
                            (float) $userLongitude,
                            (float) $this->clinic->latitude,
                            (float) $this->clinic->longitude
                        );
                    }
                }

                // Get clinic rating and reviews
                $clinicRating = $this->getClinicRating();
                $clinicTotalReviews = $this->getClinicTotalReviews();

                // Use address field directly - no combining block, street, etc.
                $fullAddress = $this->clinic->address ? trim($this->clinic->address) : null;

                // Build display address - show only area if no booking, otherwise show address
                $displayAddress = null;
                if ($hasBooking) {
                    $displayAddress = $fullAddress;
                } else {
                    // When no booking: return ONLY area name or null
                    if ($this->clinic->relationLoaded('area') && $this->clinic->area) {
                        $displayAddress = $this->localized('name', null, $this->clinic->area);
                    }
                }

                return [
                    'id' => $this->clinic->id,
                    'name' => $this->localized('name', null, $this->clinic),
                    'logo' => $clinicLogo,
                    'image' => $clinicLogo, // Keep for backward compatibility
                    'address' => $displayAddress,
                    'full_address' => $fullAddress,
                    'phone' => $hasBooking ? $this->clinic->phone : null,
                    'email' => $hasBooking ? $this->clinic->email : null,
                    'latitude' => $this->clinic->latitude ? (float) $this->clinic->latitude : null,
                    'longitude' => $this->clinic->longitude ? (float) $this->clinic->longitude : null,
                    'distance' => $distance ? round($distance, 2) : null,
                    'rating' => $clinicRating,
                    'total_reviews' => $clinicTotalReviews,
                    'is_featured' => $this->clinic->is_featured ?? false,
                    'status' => $this->clinic->status,
                    'area' => $this->clinic->relationLoaded('area') && $this->clinic->area ? [
                        'id' => $this->clinic->area->id,
                        'name' => $this->localized('name', null, $this->clinic->area),
                    ] : null,
                    'governorate' => $this->clinic->relationLoaded('governorate') && $this->clinic->governorate ? [
                        'id' => $this->clinic->governorate->id,
                        'name' => $this->localized('name', null, $this->clinic->governorate),
                    ] : null,
                    'owner' => $this->clinic->relationLoaded('owner') && $this->clinic->owner ? [
                        'id' => $this->clinic->owner->id,
                        'name' => $this->clinic->owner->name,
                        'email' => $hasBooking ? $this->clinic->owner->email : null,
                    ] : null,
                ];
            }),
            'category' => $this->whenLoaded('category', function () {
                if (!$this->category) {
                    return null;
                }

                // Get category image using the same logic as CategoryResource
                $categoryImage = $this->getCategoryImage($this->category);

                return [
                    'id' => $this->category->id,
                    'name' => $this->localized('name', null, $this->category),
                    'image' => $categoryImage,
                ];
            }),
        ];
    }

    /**
     * Get image URL from media relationship
     */
    private function getImageFromMedia(): ?string
    {
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $primaryMedia = $this->media->where('is_primary', true)->first()
                ?? $this->media->where('collection_name', 'images')->first()
                ?? $this->media->first();
            if ($primaryMedia) {
                return $primaryMedia->file_name ?? $primaryMedia->url ?? null;
            }
        }
        return null;
    }

    /**
     * Get category image URL from media relationship (same logic as CategoryResource)
     */
    private function getCategoryImage($category): ?string
    {
        $imagePath = null;
        
        // First, try to get from media relationship
        if ($category->relationLoaded('media') && $category->media && $category->media->isNotEmpty()) {
            $categoryImage = $category->media->where('collection_name', 'category_images')->first() 
                ?? $category->media->where('collection_name', 'images')->first() 
                ?? $category->media->first();
            if ($categoryImage) {
                $imagePath = $categoryImage->file_name ?? $categoryImage->url ?? null;
            }
        }
        
        // Fallback to image field if media not loaded or image not found
        if (!$imagePath && isset($category->image)) {
            $imagePath = $category->image;
        }
        
        // Convert to full URL if we have a path
        if ($imagePath) {
            return $this->formatImageUrl($imagePath);
        }
        
        return null;
    }
    
    /**
     * Format image path to full URL (same logic as CategoryResource)
     */
    private function formatImageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        
        // If it's already a full URL, return it
        if (filter_var($path, FILTER_VALIDATE_URL) || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
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
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Get clinic average rating
     */
    private function getClinicRating(): float
    {
        if (!$this->relationLoaded('clinic') || !$this->clinic) {
            return 0.0;
        }

        $averageRating = \App\Models\Review::where('clinic_id', $this->clinic->id)
            ->where(function($query) {
                $query->where('status', 'approved')
                      ->orWhereNull('status'); // Handle old reviews without status
            })
            ->whereNotNull('rating')
            ->where('rating', '>', 0)
            ->avg('rating');

        if ($averageRating !== null && $averageRating > 0) {
            return (float) round($averageRating, 2);
        }

        // Fallback to database value if calculation returns null/0
        if ($this->clinic->average_rating && $this->clinic->average_rating > 0) {
            return (float) $this->clinic->average_rating;
        }

        return 0.0;
    }

    /**
     * Get clinic total reviews
     */
    private function getClinicTotalReviews(): int
    {
        if (!$this->relationLoaded('clinic') || !$this->clinic) {
            return 0;
        }

        $totalReviews = \App\Models\Review::where('clinic_id', $this->clinic->id)
            ->where(function($query) {
                $query->where('status', 'approved')
                      ->orWhereNull('status'); // Handle old reviews without status
            })
            ->count();

        if ($totalReviews > 0) {
            return $totalReviews;
        }

        // Fallback to database value if calculation returns 0
        return $this->clinic->total_reviews ?? 0;
    }

    /**
     * Check if logged-in user has any bookings with this clinic
     */
    protected function userHasBooking($user, int $clinicId): bool
    {
        if (!$user) {
            return false;
        }

        return \App\Models\Booking::where('user_id', $user->id)
            ->where('clinic_id', $clinicId)
            ->exists();
    }
}

