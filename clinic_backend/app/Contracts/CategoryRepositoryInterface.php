<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface CategoryRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active categories
     */
    public function getActiveCategories(): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get featured categories
     */
    public function getFeaturedCategories(int $limit = 8): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get categories with services count
     */
    public function getCategoriesWithServicesCount(): \Illuminate\Database\Eloquent\Collection;
}