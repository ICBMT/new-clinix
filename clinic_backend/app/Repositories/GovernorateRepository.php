<?php

namespace App\Repositories;

use App\Contracts\GovernorateRepositoryInterface;
use App\Models\Governorate;

class GovernorateRepository extends BaseRepository implements GovernorateRepositoryInterface
{
    protected array $searchableFields = ['name_en', 'name_ar'];
    protected array $filterableFields = []; // is_active is handled in applyCustomFilters

    public function __construct(Governorate $model)
    {
        parent::__construct($model);
    }

    /**
     * Apply custom filters
     */
    protected function applyCustomFilters(\Illuminate\Database\Eloquent\Builder $query, \Illuminate\Http\Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $filters = $request->get('filters', []);
        
        // Handle is_active filter - convert string to boolean
        if (isset($filters['is_active']) && $filters['is_active'] !== null && $filters['is_active'] !== 'all') {
            $isActive = $filters['is_active'];
            // Convert to boolean properly
            if (is_string($isActive)) {
                $isActive = ($isActive === 'true' || $isActive === '1');
            } elseif (is_bool($isActive)) {
                // Already boolean, use as is
            } else {
                // Convert to boolean
                $isActive = (bool) $isActive;
            }
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
     * Get active governorates with nested areas
     */
    public function getActiveGovernoratesWithAreas(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->active()
            ->with('areas')
            ->orderBy('name_en')
            ->get();
    }
}

