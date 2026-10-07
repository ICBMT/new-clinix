<?php

namespace App\Http\Resources\Api\V1\Treatment;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use Illuminate\Http\Request;

class TreatmentResource extends BaseResource
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
            'service_duration_minutes' => $this->service_duration_minutes,
            'duration_minutes' => $this->service_duration_minutes,
            'is_featured' => $this->is_featured ?? false,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'suitable_for_skin_types' => $this->suitable_for_skin_types ?? [],
            'suitable_for_conditions' => $this->suitable_for_conditions ?? [],
            'min_age' => $this->min_age,
            'max_age' => $this->max_age,
            'gender_restriction' => $this->gender_restriction,
            'treatment_steps' => $this->localized('treatment_steps') ?? [],
            'estimated_recovery_days' => $this->estimated_recovery_days,
            'sessions_required' => $this->sessions_required,
            'max_sessions' => $this->max_sessions,
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
            'clinic' => $this->whenLoaded('clinic', function () {
                if (!$this->clinic) {
                    return null;
                }
                return [
                    'id' => $this->clinic->id,
                    'name' => $this->localized('name', $this->clinic),
                    'logo' => $this->clinic->logo ? (str_starts_with($this->clinic->logo, 'http://') || str_starts_with($this->clinic->logo, 'https://') ? $this->clinic->logo : asset('storage/' . ltrim($this->clinic->logo, '/'))) : null,
                ];
            }),
            'category' => $this->whenLoaded('category', function () {
                return new CategoryResource($this->category);
            }),
            'machines' => $this->whenLoaded('machines', function () {
                return \App\Http\Resources\Api\V1\Machine\MachineResource::collection($this->machines);
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
}

