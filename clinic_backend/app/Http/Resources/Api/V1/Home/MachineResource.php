<?php

namespace App\Http\Resources\Api\V1\Home;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Category\CategoryResource;
use Illuminate\Http\Request;

class MachineResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
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

    /**
     * Get image URL from media relationship
     */
    private function getImageFromMedia(): ?string
    {
        // First, try to get image from media relationship
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $imageMedia = $this->media->where('collection_name', 'images')->first() ?? $this->media->first();
            if ($imageMedia) {
                $imagePath = $imageMedia->file_name ?? $imageMedia->url ?? null;
                if ($imagePath) {
                    // Convert to full URL if it's a storage path
                    return $this->formatImageUrl($imagePath);
            }
        }
        }
        
        // Fallback to image field if media not loaded or empty
        if ($this->image) {
            return $this->formatImageUrl($this->image);
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
}

