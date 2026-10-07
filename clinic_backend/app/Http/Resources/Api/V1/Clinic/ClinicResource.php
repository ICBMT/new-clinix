<?php

namespace App\Http\Resources\Api\V1\Clinic;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use App\Http\Resources\Api\V1\Area\AreaResource;
use App\Http\Resources\Api\V1\Governorate\GovernorateResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use Illuminate\Http\Request;

class ClinicResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        // Check if logged-in user has any bookings with this clinic
        $user = $request->user();
        $hasBooking = $this->userHasBooking($user);
        
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
            'owner_id' => $this->owner_id,
            'category_id' => $this->category_id,
            'name' => $this->localized('name'),
            'address' => $displayAddress,
            'full_address' => $fullAddress,
            'phone' => $hasBooking ? $this->phone : null,
            'email' => $hasBooking ? $this->email : null,
            'logo' => $this->getLogoFromMedia(),
            'image' => $this->getLogoFromMedia(),
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
            
            // Relationships
            'owner' => $this->whenLoaded('owner', function () use ($hasBooking) {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $hasBooking ? $this->owner->email : null,
                    'phone' => $hasBooking ? $this->owner->phone : null,
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
            'operating_hours' => $this->whenLoaded('operatingHours', function () {
                return ClinicOperatingHourResource::collection($this->operatingHours);
            }),
            'active_subscription' => $this->whenLoaded('activeSubscription', function () {
                return new ClinicSubscriptionResource($this->activeSubscription);
            }),
            'media' => $this->whenLoaded('media', function () {
                return MediaResource::collection($this->media);
            }),
        ];
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
     */
    private function getLogoFromMedia(): ?string
    {
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $logoMedia = $this->media->where('collection_name', 'logos')->first() 
                ?? $this->media->where('collection_name', 'images')->first() 
                ?? $this->media->first();
            if ($logoMedia) {
                return $logoMedia->file_name ?? $logoMedia->url ?? null;
            }
        }
        // Fallback to logo field if media not loaded
        return $this->logo;
    }
}

