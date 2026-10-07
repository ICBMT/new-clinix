<?php

namespace App\Repositories;

use App\Contracts\CategoryRepositoryInterface;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryRepository extends BaseRepository implements CategoryRepositoryInterface
{
    protected array $searchableFields = [
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
    ];

    protected array $filterableFields = [
        'status',
        'parent_id',
        'sort_order',
    ];

    /**
     * Get active categories
     */
    public function getActiveCategories(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->with('media')
            ->where('status', 'active')
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    /**
     * Get featured categories
     */
    public function getFeaturedCategories(int $limit = 8): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->with('media')
            ->where('status', 'active')
            ->orderBy('sort_order', 'asc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get categories with services count
     */
    public function getCategoriesWithServicesCount(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('status', 'active')
            ->withCount('services')
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    /**
     * Apply custom filters (date range filters)
     */
    protected function applyCustomFilters(\Illuminate\Database\Eloquent\Builder $query, \Illuminate\Http\Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $filters = $request->get('filters', []);

        // Apply date range filters
        if (isset($filters['created_from']) && $filters['created_from']) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (isset($filters['created_to']) && $filters['created_to']) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        // Always load media and parent relationships
        $query->with(['media', 'parent']);

        return $query;
    }
}
