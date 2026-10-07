<?php

namespace App\Http\Resources\Api\V1\Treatment;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use App\Http\Resources\Api\V1\Machine\MachineResource;
use App\Http\Resources\Api\V1\Clinic\ClinicOperatingHourResource;
use Illuminate\Http\Request;

class TreatmentDetailResource extends BaseResource
{
    public function toArray(Request $request): array
    {

        // Calculate discount - only show discount if treatment is active (approved)
        $isActive = $this->status === 'approved';
        $hasDiscount = false;
        $discountType = null;
        $discountValue = null;
        $discountPercentage = 0;
        $currentPrice = $this->final_price ? (float) $this->final_price : ($this->base_price ? (float) $this->base_price : null);
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

        // Format treatment steps with numbers
        $treatmentSteps = [];
        $steps = $this->localized('treatment_steps') ?? [];
        if (is_array($steps)) {
            foreach ($steps as $index => $step) {
                if (is_array($step)) {
                    // Handle structured step data
                    $title = $step['title'] ?? $step['name'] ?? '';
                    $duration = $step['duration'] ?? $step['duration_minutes'] ?? null;
                    $description = $step['description'] ?? '';

                    // If title contains duration (e.g., "Medical Consultation: 10 minutes")
                    if (empty($duration) && preg_match('/(\d+)\s*(?:minutes?|mins?)/i', $title, $matches)) {
                        $duration = (int) $matches[1];
                        $title = preg_replace('/:\s*\d+\s*(?:minutes?|mins?)/i', '', $title);
                    }

                    $treatmentSteps[] = [
                        'number' => str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                        'title' => trim($title),
                        'duration' => $duration ? (int) $duration : null,
                        'duration_text' => $duration ? __('common.duration_minutes', ['duration' => $duration]) : null,
                        'description' => trim($description),
                    ];
                } elseif (is_string($step)) {
                    // Handle string format: "Title: Duration minutes" or just "Title"
                    $duration = null;
                    $title = $step;

                    if (preg_match('/^(.+?):\s*(\d+)\s*(?:minutes?|mins?)/i', $step, $matches)) {
                        $title = trim($matches[1]);
                        $duration = (int) $matches[2];
                    }

                    $treatmentSteps[] = [
                        'number' => str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                        'title' => trim($title),
                        'duration' => $duration,
                        'duration_text' => $duration ? __('common.duration_minutes', ['duration' => $duration]) : null,
                        'description' => '',
                    ];
                }
            }
        }

        // Build full address for clinic - ensure clinic name never appears
        $clinicFullAddress = null;
        if ($this->relationLoaded('clinic') && $this->clinic) {
            // Get clinic names for comparison
            $nameEnTrimmed = $this->clinic->name_en ? trim($this->clinic->name_en) : '';
            $nameArTrimmed = $this->clinic->name_ar ? trim($this->clinic->name_ar) : '';
            $nameEnLower = strtolower($nameEnTrimmed);
            $nameArLower = strtolower($nameArTrimmed);
            
            $addressParts = array_filter([
                $this->clinic->block ? __('common.address_block') . $this->clinic->block : null,
                $this->clinic->street ? __('common.address_street') . $this->clinic->street : null,
                $this->clinic->house ? __('common.address_building') . $this->clinic->house : null,
                $this->clinic->area ? $this->localized('name', $this->clinic->area) : null,
                $this->clinic->city ?: null,
            ]);
            $clinicFullAddress = !empty($addressParts) ? implode(', ', $addressParts) : null;
            
            // Safety check: Never use $this->clinic->address if it contains the clinic name
            if ($clinicFullAddress === null && $this->clinic->address) {
                $addressTrimmed = trim($this->clinic->address);
                $addressLower = strtolower($addressTrimmed);
                
                // Check if address equals clinic name or contains clinic name
                $isClinicName = false;
                if ($addressTrimmed !== '') {
                    if ($nameEnTrimmed && strcasecmp($addressTrimmed, $nameEnTrimmed) === 0) {
                        $isClinicName = true;
                    } elseif ($nameArTrimmed && strcasecmp($addressTrimmed, $nameArTrimmed) === 0) {
                        $isClinicName = true;
                    } elseif ($nameEnLower && str_contains($addressLower, $nameEnLower)) {
                        $isClinicName = true;
                    } elseif ($nameArLower && str_contains($addressLower, $nameArLower)) {
                        $isClinicName = true;
                    }
                }
                
                // Only use address if it's not the clinic name and doesn't contain it
                if (!$isClinicName) {
                    $clinicFullAddress = $addressTrimmed;
                }
            }
            
            // Final safety check: Ensure fullAddress doesn't contain clinic name
            if ($clinicFullAddress) {
                $fullAddressLower = strtolower($clinicFullAddress);
                if (($nameEnLower && str_contains($fullAddressLower, $nameEnLower)) || 
                    ($nameArLower && str_contains($fullAddressLower, $nameArLower))) {
                    // $clinicFullAddress = null; // Removing this check to ensure location always shows
                }
            }
        }

        return [
            'id' => $this->id,
            'clinic_id' => $this->clinic_id,
            'category_id' => $this->category_id,
            'name' => $this->localized('name'),
            'description' => $this->localized('description'),
            'preparation_instructions' => $this->localized('preparation_instructions'),
            'aftercare_instructions' => $this->localized('aftercare_instructions'),
            'side_effects' => $this->localized('side_effects'),
            'warnings' => $this->localized('warnings'),
            'base_price' => $originalPrice,
            'final_price' => $currentPrice,
            'current_price' => $currentPrice,
            'original_price' => $hasDiscount ? $originalPrice : null,
            'has_discount' => $hasDiscount,
            'discount_type' => $hasDiscount ? $discountType : null,
            'discount_value' => $hasDiscount ? $discountValue : null,
            'discount_percentage' => $hasDiscount ? $discountPercentage : 0,
            'currency' => $this->currency ?? 'KWD',
            'service_duration_minutes' => $this->service_duration_minutes ?? 60,
            'duration_minutes' => $this->service_duration_minutes ?? 60,
            'sessions_required' => $this->sessions_required ?? 1,
            'max_sessions' => $this->max_sessions,
            'estimated_recovery_days' => $this->estimated_recovery_days,
            'is_featured' => $this->is_featured ?? false,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'suitable_for_skin_types' => $this->suitable_for_skin_types ?? [],
            'suitable_for_conditions' => $this->suitable_for_conditions ?? [],
            'min_age' => $this->min_age,
            'max_age' => $this->max_age,
            'gender_restriction' => $this->gender_restriction,
            'treatment_steps' => $treatmentSteps,
            'video_url' => $this->video_url,
            'faq' => $this->faq ?? [],
            'requires_consultation' => $this->requires_consultation ?? false,
            'requires_medical_clearance' => $this->requires_medical_clearance ?? false,
            'popularity_score' => $this->popularity_score ?? 0,
            'featured_until' => $this->featured_until?->toISOString(),
            'slug' => $this->localized('slug'),
            'meta_description' => $this->localized('meta_description'),
            'meta_keywords' => $this->localized('meta_keywords'),
            'average_rating' => $this->average_rating ? (float) $this->average_rating : 0.0,
            'total_reviews' => $this->total_reviews ?? 0,
            'total_bookings' => $this->total_bookings ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Image - get from media relationship
            'image' => $this->getImageFromMedia(),
            'banner_image' => $this->getImageFromMedia(),

            // Relationships
            'clinic' => $this->whenLoaded('clinic', function () use ($clinicFullAddress, $request) {
                if (!$this->clinic) {
                    return null;
                }

                // Check if logged-in user has any bookings with this clinic
                $user = $request->user();
                $hasBooking = $this->userHasBooking($user, $this->clinic->id);

                // Get clinic logo from media relationship (similar to ClinicResource)
                $clinicLogo = $this->getClinicLogoFromMedia();

                // Get clinic name - use localized method
                $clinicName = $this->localized('name', '', $this->clinic);

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

                // Check if clinic is inactive (only 'approved' status is considered active)
                $isClinicInactive = $this->clinic->status !== 'approved';
                $clinicUnavailableMessage = $isClinicInactive 
                    ? __('common.clinic_not_available')
                    : null;

                // Build display address - show only area if no booking, otherwise show full address
                $displayAddress = null;
                if ($hasBooking) {
                    $displayAddress = $clinicFullAddress;
                } else {
                    // When no booking: return ONLY area name or null
                    if ($this->clinic->relationLoaded('area') && $this->clinic->area) {
                        $displayAddress = $this->localized('name', $this->clinic->area);
                    }
                }

                return [
                    'id' => $this->clinic->id,
                    'name' => $clinicName,
                    'logo' => $clinicLogo,
                    'image' => $clinicLogo, // Keep for backward compatibility
                    'address' => $displayAddress,
                    'full_address' => $hasBooking ? $clinicFullAddress : null,
                    'phone' => $hasBooking ? $this->clinic->phone : null,
                    'email' => $hasBooking ? $this->clinic->email : null,
                    'latitude' => $this->clinic->latitude ? (float) $this->clinic->latitude : null,
                    'longitude' => $this->clinic->longitude ? (float) $this->clinic->longitude : null,
                    'distance' => $distance ? round($distance, 2) : null,
                    'rating' => $clinicRating,
                    'total_reviews' => $clinicTotalReviews,
                    'is_featured' => $this->clinic->is_featured ?? false,
                    'status' => $this->clinic->status,
                    'is_unavailable' => $isClinicInactive,
                    'unavailable_message' => $clinicUnavailableMessage,
                    'area' => $this->clinic->relationLoaded('area') && $this->clinic->area ? [
                        'id' => $this->clinic->area->id,
                        'name' => $this->localized('name', $this->clinic->area),
                    ] : null,
                    'governorate' => $this->clinic->relationLoaded('governorate') && $this->clinic->governorate ? [
                        'id' => $this->clinic->governorate->id,
                        'name' => $this->localized('name', $this->clinic->governorate),
                    ] : null,
                    'owner' => $this->clinic->relationLoaded('owner') && $this->clinic->owner ? [
                        'id' => $this->clinic->owner->id,
                        'name' => $this->clinic->owner->name,
                        'email' => $hasBooking ? $this->clinic->owner->email : null,
                    ] : null,
                    'cancellation_policy' => $this->localized('cancellation_policy', $this->clinic),
                    'refund_policy' => $this->localized('refund_policy', $this->clinic),
                    'reschedule_policy' => $this->localized('reschedule_policy', $this->clinic),
                    'privacy_policy' => $this->localized('privacy_policy', $this->clinic),
                    'terms_and_conditions' => $this->localized('terms_and_conditions', $this->clinic),
                ];
            }),

            'category' => $this->whenLoaded('category', function () {
                return new CategoryResource($this->category);
            }),

            'machines' => $this->whenLoaded('machines', function () {
                return MachineResource::collection($this->machines);
            }),

            'media' => $this->whenLoaded('media', function () {
                return MediaResource::collection($this->media);
            }),
        ];
    }

    /**
     * Get image URL from media relationship
     */
    private function getImageFromMedia(): ?string
    {
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $imageMedia = $this->media->where('collection_name', 'images')->first() ?? $this->media->first();
            if ($imageMedia) {
                return $imageMedia->file_name ?? $imageMedia->url ?? null;
            }
        }
        return null;
    }

    /**
     * Get clinic logo URL from clinic's media relationship
     * Only looks for 'logos' collection to avoid picking up machine images or other media
     */
    private function getClinicLogoFromMedia(): ?string
    {
        if (!$this->relationLoaded('clinic') || !$this->clinic) {
            return null;
        }

        $logoPath = null;

        // First, try to get logo from 'logos' collection in clinic's media
        if ($this->clinic->relationLoaded('media') && $this->clinic->media->isNotEmpty()) {
            $logoMedia = $this->clinic->media->where('collection_name', 'logos')->first();
            if ($logoMedia) {
                $logoPath = $logoMedia->file_name ?? $logoMedia->url ?? null;
            }
        }
        
        // Fallback to clinic's logo field (which should contain the logo path)
        if (!$logoPath) {
            $logoPath = $this->clinic->logo;
        }

        // Convert to full URL if we have a path
        if ($logoPath) {
            return $this->formatImageUrl($logoPath);
        }

        return null;
    }

    /**
     * Format image path to full URL
     */
    private function formatImageUrl(?string $path): ?string
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
