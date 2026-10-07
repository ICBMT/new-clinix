<?php

namespace App\Http\Resources\Api\V1\Machine;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use Illuminate\Http\Request;

class MachineResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'model' => $this->localized('model'),
            'manufacturer' => $this->localized('manufacturer'),
            'serial_number' => $this->serial_number,
            'image' => $this->getImageFromMedia(),
            'status' => $this->status,
            'description' => $this->localized('description'),
            'clinic' => $this->whenLoaded('clinic', function () {
                if (!$this->clinic) {
                    return null;
                }
                // Return just the clinic name as a string
                return $this->localized('name', null, $this->clinic);
            }),
            'category_id' => $this->category_id, // Keep for backward compatibility
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? new CategoryResource($this->category) : null;
            }), // Keep for backward compatibility
            'categories' => $this->whenLoaded('categories', function () {
                if ($this->categories && $this->categories->isNotEmpty()) {
                    return CategoryResource::collection($this->categories);
                }
                return [];
            }, []), // Always return array, even if empty
        ];
    }

    private function getStatusLabel(): string
    {
        return match($this->status) {
            'ready' => __('common.ready'),
            'maintenance' => __('common.maintenance'),
            'busy' => __('common.busy'),
            default => __('common.unknown'),
        };
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
        // Fallback to image field if media not loaded
        return $this->image;
    }
}

