<?php

namespace App\Http\Resources\Api\V1\Clinic;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use App\Http\Resources\Api\V1\Area\AreaResource;
use App\Http\Resources\Api\V1\Governorate\GovernorateResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentResource;
use App\Http\Resources\Api\V1\Machine\MachineResource;
use App\Contracts\BookingRepositoryInterface;
use Illuminate\Http\Request;

class ClinicDetailResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        // Check if logged-in user has any bookings with this clinic
        $user = $request->user();
        $hasBooking = $this->userHasBooking($user);

        // Calculate distance if latitude/longitude provided
        $distance = null;
        if ($request->has('latitude') && $request->has('longitude') && $this->latitude && $this->longitude) {
            $distance = $this->calculateDistance(
                $request->input('latitude'),
                $request->input('longitude'),
                $this->latitude,
                $this->longitude
            );
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

        // Calculate rating distribution from reviews for this clinic
        $ratingDistribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        $reviews = \App\Models\Review::where('clinic_id', $this->id)
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->get();
        
        foreach ($reviews as $item) {
            if (isset($ratingDistribution[$item->rating])) {
                $ratingDistribution[$item->rating] = (int) $item->count;
            }
        }

        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'category_id' => $this->category_id,
            'name' => $this->localized('name'),
            'address' => $displayAddress,
            'full_address' => $fullAddress,
            'phone' => $hasBooking ? $this->phone : null,
            'email' => $hasBooking ? $this->email : null,
            'logo' => $this->logo,
            'image' => $this->logo,
            'bio' => $this->localized('bio'),
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'approved_at' => $this->approved_at?->toISOString(),
            'governorate_id' => $this->governorate_id,
            'area_id' => $this->area_id,
            'block' => $hasBooking ? $this->block : null,
            'street' => $hasBooking ? $this->street : null,
            'avenue' => $hasBooking ? $this->avenue : null,
            'house' => $hasBooking ? $this->house : null,
            'floor' => $hasBooking ? $this->floor : null,
            'apt' => $hasBooking ? $this->apt : null,
            'city' => $hasBooking ? $this->city : null,
            'state' => $hasBooking ? $this->state : null,
            'country' => $hasBooking ? $this->country : null,
            'postal_code' => $hasBooking ? $this->postal_code : null,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'distance' => $distance ? round($distance, 2) : null, // Distance in kilometers
            'average_rating' => $this->average_rating ? (float) $this->average_rating : 0.0,
            'total_reviews' => $this->total_reviews ?? 0,
            'total_bookings' => $this->total_bookings ?? 0,
            'is_featured' => $this->is_featured ?? false,
            'is_favorite' => $this->isFavorite($request, 'clinic'),
            'can_review' => $this->canReview($request),
            'auto_confirm_bookings' => $this->auto_confirm_bookings ?? false,
            'slot_duration_minutes' => $this->slot_duration_minutes,
            'cancellation_policy' => $this->localized('cancellation_policy'),
            'refund_policy' => $this->localized('refund_policy'),
            'reschedule_policy' => $this->localized('reschedule_policy'),
            'subscription_id' => $this->subscription_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Image gallery
            'banner_image' => $this->logo,
            'gallery_images' => [],
            
            // Rating distribution
            'rating_distribution' => [
                '5' => $ratingDistribution[5],
                '4' => $ratingDistribution[4],
                '3' => $ratingDistribution[3],
                '2' => $ratingDistribution[2],
                '1' => $ratingDistribution[1],
            ],
            
            // Relationships
            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                    'phone' => $this->owner->phone,
                ];
            }),
            'category' => $this->whenLoaded('category', function () {
                return new CategoryResource($this->category);
            }),
            'governorate' => $this->whenLoaded('governorate', function () {
                return new GovernorateResource($this->governorate);
            }),
            'area' => $this->whenLoaded('area', function () {
                return new AreaResource($this->area);
            }),
            'treatments' => $this->whenLoaded('treatments', function () {
                return TreatmentResource::collection($this->treatments);
            }),
            'machines' => $this->whenLoaded('machines', function () {
                return MachineResource::collection($this->machines);
            }),
            'reviews' => $this->when(true, function () {
                // Get reviews for this clinic
                $reviews = \App\Models\Review::where('clinic_id', $this->id)
                    ->with(['user', 'booking', 'treatment'])->get();
                
                return $reviews->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'user' => $item->user ? [
                            'id' => $item->user->id,
                            'name' => $item->user->name,
                        ] : null,
                        'rating' => $item->rating,
                        'comment' => $item->comment,
                        'additional_data' => $item->additional_data,
                        'created_at' => $item->created_at?->toISOString(),
                    ];
                });
            }),
            'operating_hours' => $this->whenLoaded('operatingHours', function () {
                return ClinicOperatingHourResource::collection($this->operatingHours);
            }),
            'active_subscription' => $this->whenLoaded('activeSubscription', function () {
                return new ClinicSubscriptionResource($this->activeSubscription);
            }),
            'media' => $this->whenLoaded('media', function () {
                return MediaResource::collection($this->media);
            }),
            'unreviewed_bookings' => $this->when($request->user(), function () use ($request) {
                $user = $request->user();
                if (!$user) {
                    return [];
                }

                // Get unreviewed bookings via repository
                $bookingRepository = app(BookingRepositoryInterface::class);
                $unreviewedBookings = $bookingRepository->getUnreviewedBookingsForClinic($user->id, $this->id, 10);
                
                return $unreviewedBookings->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'treatment_id' => $booking->treatment_id,
                        'treatment_name' => $booking->treatment ? $this->localized('name', null, $booking->treatment) : null,
                        'total_amount' => $booking->total_amount,
                        'completed_at' => $booking->completed_at?->toIso8601String(),
                    ];
                });
            }),
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
}














