<?php

namespace App\Http\Resources\Api\V1\Home;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class BannerResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->localized('name'),
            'title' => $this->localized('title'),
            'description' => $this->localized('description'),
            'image_url' => $this->getImageFromMedia(),
            'mobile_image_url' => $this->getMobileImageFromMedia(),
            'linkable_type' => $this->linkable_type,
            'linkable_id' => $this->linkable_id,
            'type' => $this->type,
            'position' => $this->position,
            'sort_order' => $this->sort_order ?? 0,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'start_time' => $this->start_time?->format('H:i'),
            'end_time' => $this->end_time?->format('H:i'),
            'status' => $this->status,
            'click_count' => $this->click_count ?? 0,
        ];
    }

    /**
     * Get image URL from media relationship
     */
    private function getImageFromMedia(): ?string
    {
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $imageMedia = $this->media->where('collection_name', 'images')->first();
            if ($imageMedia) {
                return $imageMedia->file_name ?? $imageMedia->url ?? null;
            }
        }
        // Fallback to image_url field if media not loaded
        return $this->image_url;
    }

    /**
     * Get mobile image URL from media relationship
     */
    private function getMobileImageFromMedia(): ?string
    {
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $mobileImageMedia = $this->media->where('collection_name', 'mobile_images')->first();
            if ($mobileImageMedia) {
                return $mobileImageMedia->file_name ?? $mobileImageMedia->url ?? null;
            }
        }
        // Fallback to mobile_image_url field if media not loaded
        return $this->mobile_image_url ?? null;
    }
}
