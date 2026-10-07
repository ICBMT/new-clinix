<?php

namespace App\Http\Resources;

use App\Contracts\FavoriteRepositoryInterface;
use Illuminate\Http\Resources\Json\JsonResource;

class BaseResource extends JsonResource
{
    /**
     * Cache for user favorite IDs by type and user ID
     * Structure: [userId => [type => [ids...]]]
     */
    private static array $favoriteIdsCache = [];

    /**
     * Get localized field value based on current locale
     *
     * @param string $fieldName Base field name (without _en or _ar suffix)
     * @param mixed $default Default value if field doesn't exist
     * @param mixed $model Optional model to localize (if not provided, uses $this->resource)
     * @return mixed
     */
    protected function localized(string $fieldName, mixed $default = null, mixed $model = null): mixed
    {
        $locale = app()->getLocale();
        $isArabic = $locale === 'ar';
        
        $localizedField = $fieldName . ($isArabic ? '_ar' : '_en');
        $fallbackField = $fieldName . ($isArabic ? '_en' : '_ar');
        
        // Use provided model or default to current resource
        $targetModel = $model ?? $this->resource;
        
        // Try localized field first, then fallback, then default
        return $targetModel->{$localizedField} 
            ?? $targetModel->{$fallbackField} 
            ?? $default;
    }
    
    /**
     * Check if current locale is Arabic
     *
     * @return bool
     */
    protected function isArabic(): bool
    {
        return app()->getLocale() === 'ar';
    }
    
    /**
     * Get current locale
     *
     * @return string
     */
    protected function locale(): string
    {
        return app()->getLocale();
    }

    /**
     * Check if the resource is favorited by the authenticated user
     * Uses repository pattern to avoid direct queries
     *
     * @param \Illuminate\Http\Request $request
     * @param string $type Favorite type: 'clinic', 'treatment', or 'machine'
     * @return bool
     */
    protected function isFavorite(\Illuminate\Http\Request $request, string $type): bool
    {
        $user = $request->user();
        
        if (!$user) {
            return false;
        }

        $userId = $user->id;
        
        // Check cache first
        if (!isset(self::$favoriteIdsCache[$userId][$type])) {
            $favoriteRepository = app(FavoriteRepositoryInterface::class);
            self::$favoriteIdsCache[$userId][$type] = $favoriteRepository->getUserFavoriteIds($userId, $type);
        }

        return in_array($this->id, self::$favoriteIdsCache[$userId][$type] ?? []);
    }
}

