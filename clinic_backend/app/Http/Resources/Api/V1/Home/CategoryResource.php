<?php

namespace App\Http\Resources\Api\V1\Home;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class CategoryResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->localized('name'),
            'description' => $this->localized('description'),
            'parent_id' => $this->parent_id,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'image' => $this->getImageFromMedia(),
        ];
    }

    /**
     * Get image URL from image_url field or media relationship
     */
    private function getImageFromMedia(): ?string
    {
        // First priority: use image_url field (URL stored directly)
        if (!empty($this->image_url)) {
            // If it's already a full URL, return it
            if (filter_var($this->image_url, FILTER_VALIDATE_URL) || str_starts_with($this->image_url, 'http://') || str_starts_with($this->image_url, 'https://')) {
                return $this->image_url;
            }
            // Otherwise, treat it as a path and format it
            return $this->formatImageUrl($this->image_url);
        }
        
        $imagePath = null;
        
        // Second priority: try to get from media relationship
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $categoryImage = $this->media->where('collection_name', 'category_images')->first() 
                ?? $this->media->where('collection_name', 'images')->first() 
                ?? $this->media->first();
            if ($categoryImage) {
                $imagePath = $categoryImage->file_name ?? $categoryImage->url ?? null;
            }
        }
        
        // Third priority: fallback to image field if media not loaded or image not found
        if (!$imagePath) {
            $imagePath = $this->image;
        }
        
        // Convert to full URL if we have a path
        if ($imagePath) {
            return $this->formatImageUrl($imagePath);
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
}
