<?php

namespace App\Http\Resources\Api\V1\Home;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class ClinicResource extends BaseResource
{
    /**
     * Cache for user location by user ID
     * Structure: [userId => ['latitude' => float, 'longitude' => float]]
     */
    private static array $userLocationCache = [];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Check if logged-in user has any bookings with this clinic
        $user = $request->user();
        $hasBooking = $this->userHasBooking($user);
        
        // Use distance from model if available (from getNearbyClinics), otherwise calculate
        $distance = null;
        if (isset($this->distance)) {
            // Distance already calculated by getNearbyClinics query
            $distance = (float) $this->distance;
        } elseif ($this->latitude && $this->longitude) {
            // Get user location from request or authenticated user's address
            $userLatitude = $request->input('latitude');
            $userLongitude = $request->input('longitude');
            
            // If not in request, try to get from authenticated user's default address (with caching)
            if ((!$userLatitude || !$userLongitude) && $request->user()) {
                $user = $request->user();
                $userId = $user->id;
                
                // Check cache first
                if (!isset(self::$userLocationCache[$userId])) {
                    $defaultAddress = \App\Models\Address::where('user_id', $userId)
                        ->where('is_default', true)
                        ->whereNotNull('latitude')
                        ->whereNotNull('longitude')
                        ->first();
                    
                    if (!$defaultAddress) {
                        // Try to get any address with coordinates
                        $defaultAddress = \App\Models\Address::where('user_id', $userId)
                            ->whereNotNull('latitude')
                            ->whereNotNull('longitude')
                            ->first();
                    }
                    
                    if ($defaultAddress) {
                        self::$userLocationCache[$userId] = [
                            'latitude' => (float) $defaultAddress->latitude,
                            'longitude' => (float) $defaultAddress->longitude,
                        ];
                    } else {
                        // Cache null to avoid repeated queries
                        self::$userLocationCache[$userId] = null;
                    }
                }
                
                if (self::$userLocationCache[$userId]) {
                    $userLatitude = self::$userLocationCache[$userId]['latitude'];
                    $userLongitude = self::$userLocationCache[$userId]['longitude'];
                }
            }
            
            // Calculate distance if we have user location
            if ($userLatitude && $userLongitude) {
                $distance = $this->calculateDistance(
                    (float) $userLatitude,
                    (float) $userLongitude,
                    (float) $this->latitude,
                    (float) $this->longitude
                );
            }
        }

        // Use address field directly - no combining block, street, etc.
        $fullAddress = $this->address ? trim($this->address) : null;

        // Build display address - show only area if no booking, otherwise show address
        $displayAddress = null;
        if ($hasBooking) {
            $displayAddress = $fullAddress;
        } else {
            // When no booking: return ONLY area name or null
            // Load area if not already loaded but area_id exists
            if (!$this->relationLoaded('area') && $this->area_id) {
                try {
                    $this->load('area:id,name_en,name_ar');
                } catch (\Exception $e) {
                    // If loading fails, area doesn't exist - keep as null
                }
            }
            
            if ($this->area && $this->relationLoaded('area') && isset($this->area->id)) {
                $displayAddress = $this->localized('name', null, $this->area);
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->localized('name'),
            'logo' => $this->getLogoFromMedia(),
            'image' => $this->getLogoFromMedia(),
            'address' => $displayAddress,
            'full_address' => $fullAddress,
            'email' => $hasBooking ? $this->email : null,
            'area' => $this->whenLoaded('area', function () {
                // Get area name directly - don't use localized() to avoid any fallback issues
                if (!$this->area || !isset($this->area->id)) {
                    return null;
                }
                
                $locale = app()->getLocale();
                $isArabic = $locale === 'ar';
                $areaNameField = $isArabic ? 'name_ar' : 'name_en';
                $fallbackField = $isArabic ? 'name_en' : 'name_ar';
                
                // Get area name directly from the area model
                $areaName = $this->area->{$areaNameField} ?? $this->area->{$fallbackField} ?? null;
                
                // Ensure area name is not the clinic name
                $areaNameTrimmed = $areaName ? trim($areaName) : '';
                $nameEnTrimmed = $this->name_en ? trim($this->name_en) : '';
                $nameArTrimmed = $this->name_ar ? trim($this->name_ar) : '';
                
                // Only return if area name is valid and not the clinic name
                if ($areaNameTrimmed !== '' && 
                    strcasecmp($areaNameTrimmed, $nameEnTrimmed) !== 0 && 
                    strcasecmp($areaNameTrimmed, $nameArTrimmed) !== 0) {
                    return [
                        'id' => $this->area->id,
                        'name' => $areaNameTrimmed,
                    ];
                }
                
                // Return null if area name matches clinic name or is invalid
                return null;
            }),
            'owner' => $this->whenLoaded('owner', function () use ($hasBooking) {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $hasBooking ? $this->owner->email : null,
                ];
            }),
            'phone' => $hasBooking ? $this->phone : null,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'distance' => $distance ? round($distance, 2) : null, // Distance in kilometers
            'rating' => $this->getAverageRating(),
            'total_reviews' => $this->getTotalReviews(),
            'is_featured' => $this->is_featured ?? false,
            'is_favorite' => $this->isFavorite($request, 'clinic'),
            'can_review' => $this->canReview($request),
            'status' => $this->status,
            'cancellation_policy' => $this->localized('cancellation_policy'),
            'refund_policy' => $this->localized('refund_policy'),
            'reschedule_policy' => $this->localized('reschedule_policy'),
        ];
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
     * Check if logged-in user has any bookings with this clinic
     */
    protected function userHasBooking($user): bool
    {
        if (!$user) {
            return false;
        }

        return \App\Models\Booking::where('user_id', $user->id)
            ->where('clinic_id', $this->id)
            ->exists();
    }

    /**
     * Check if user can review this clinic
     * User can review if they have more bookings than feedback for this clinic
     */
    protected function canReview(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }

        // Count bookings for this user with this clinic
        $bookingsCount = \App\Models\Booking::where('user_id', $user->id)
            ->where('clinic_id', $this->id)
            ->count();

        // Count reviews for this user for this clinic
        $reviewCount = \App\Models\Review::where('user_id', $user->id)
            ->where('clinic_id', $this->id)
            ->count();

        // User can review if they have more bookings than reviews
        return $bookingsCount > $reviewCount;
    }

    /**
     * Get logo URL from media relationship
     * Only looks for 'logos' collection to avoid picking up machine images or other media
     */
    private function getLogoFromMedia(): ?string
    {
        // First, try to get logo from 'logos' collection in media
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $logoMedia = $this->media->where('collection_name', 'logos')->first();
            if ($logoMedia) {
                return $logoMedia->file_name ?? $logoMedia->url ?? null;
            }
        }
        
        // Fallback to clinic's logo field (which should contain the logo path)
        // This ensures we never accidentally return a machine image or other media
        return $this->logo;
    }

    /**
     * Get average rating - calculate on the fly if database value is 0 or null
     */
    private function getAverageRating(): float
    {
        // Always calculate from reviews to ensure accuracy
        // Include reviews where status is 'approved' or null (for backward compatibility)
        // Exclude soft-deleted reviews (SoftDeletes trait handles this automatically)
        $averageRating = \App\Models\Review::where('clinic_id', $this->id)
            ->where(function($query) {
                $query->where('status', 'approved')
                      ->orWhereNull('status'); // Handle old reviews without status
            })
            ->whereNotNull('rating')
            ->where('rating', '>', 0)
            ->avg('rating');

        // If calculated rating exists, use it; otherwise check database value
        if ($averageRating !== null && $averageRating > 0) {
            return (float) round($averageRating, 2);
        }

        // Fallback to database value if calculation returns null/0
        if ($this->average_rating && $this->average_rating > 0) {
            return (float) $this->average_rating;
        }

        return 0.0;
    }

    /**
     * Get total reviews - calculate on the fly if database value is 0 or null
     */
    private function getTotalReviews(): int
    {
        // Always calculate from reviews to ensure accuracy
        // Include reviews where status is 'approved' or null (for backward compatibility)
        // Exclude soft-deleted reviews (SoftDeletes trait handles this automatically)
        $calculatedCount = \App\Models\Review::where('clinic_id', $this->id)
            ->where(function($query) {
                $query->where('status', 'approved')
                      ->orWhereNull('status'); // Handle old reviews without status
            })
            ->count();

        // If calculated count exists, use it; otherwise check database value
        if ($calculatedCount > 0) {
            return (int) $calculatedCount;
        }

        // Fallback to database value if calculation returns 0
        if ($this->total_reviews && $this->total_reviews > 0) {
            return (int) $this->total_reviews;
        }

        return 0;
    }
}

