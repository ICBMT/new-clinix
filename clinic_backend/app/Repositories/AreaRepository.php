<?php

namespace App\Repositories;

use App\Contracts\AreaRepositoryInterface;
use App\Models\Area;

class AreaRepository extends BaseRepository implements AreaRepositoryInterface
{
    protected array $searchableFields = ['name_en', 'name_ar'];
    protected array $filterableFields = ['governorate_id'];

    /**
     * Override to exclude is_active from automatic filtering
     * (it's handled in applyCustomFilters)
     */
    protected function getFilterableFields(): array
    {
        return ['governorate_id'];
    }

    /**
     * Apply custom filters
     */
    protected function applyCustomFilters(\Illuminate\Database\Eloquent\Builder $query, \Illuminate\Http\Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $filters = $request->get('filters', []);
        
        // Handle is_active filter - convert string to boolean
        // Only apply filter if is_active is explicitly set and not 'all'
        if (isset($filters['is_active']) && 
            $filters['is_active'] !== null && 
            $filters['is_active'] !== '' &&
            $filters['is_active'] !== 'all') {
            $isActive = $filters['is_active'];
            
            // Convert to boolean - handle various input types
            if (is_bool($isActive)) {
                // Already boolean, use as is
            } elseif (is_string($isActive)) {
                // Handle string values: 'true', '1', 'false', '0'
                $isActive = in_array(strtolower($isActive), ['true', '1', 'yes', 'on'], true);
            } elseif (is_numeric($isActive)) {
                // Handle numeric: 1 = true, 0 = false
                $isActive = (bool) $isActive;
            } else {
                // Fallback: cast to boolean
                $isActive = (bool) $isActive;
            }
            
            // Apply the boolean filter
            $query->where('is_active', $isActive);
        }
        
        // Apply date range filters
        if (isset($filters['created_from']) && !empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }
        
        if (isset($filters['created_to']) && !empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }
        
        return $query;
    }

    /**
     * Get active areas by governorate
     */
    public function getActiveAreasByGovernorate(int $governorateId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->active()
            ->where('governorate_id', $governorateId)
            ->orderBy('name_en')
            ->get();
    }

    /**
     * Get all active areas
     */
    public function getActiveAreas(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->active()
            ->orderBy('name_en')
            ->get();
    }
}

