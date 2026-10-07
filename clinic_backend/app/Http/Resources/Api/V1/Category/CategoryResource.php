<?php

namespace App\Http\Resources\Api\V1\Category;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
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
            'sort_order' => $this->sort_order ?? 0,
            'image' => $this->getImageFromMedia(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'parent' => $this->whenLoaded('parent', function () {
                return new CategoryResource($this->parent);
            }),
            'children' => $this->whenLoaded('children', function () {
                return CategoryResource::collection($this->children);
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
        $imagePath = null;
        
        // First, try to get from media relationship
        if ($this->relationLoaded('media') && $this->media->isNotEmpty()) {
            $categoryImage = $this->media->where('collection_name', 'category_images')->first() 
                ?? $this->media->where('collection_name', 'images')->first() 
                ?? $this->media->first();
            if ($categoryImage) {
                $imagePath = $categoryImage->file_name ?? $categoryImage->url ?? null;
            }
        }
        
        // Fallback to image field if media not loaded or image not found
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

