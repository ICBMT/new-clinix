<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface FavoriteRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Toggle favorite
     */
    public function toggleFavorite(int $userId, string $type, int $itemId): bool;

    /**
     * Get user favorites
     */
    public function getUserFavorites(int $userId, string $type, int $perPage = 15): LengthAwarePaginator;

    /**
     * Check if item is favorited
     */
    public function isFavorited(int $userId, string $type, int $itemId): bool;

    /**
     * Get user's favorite IDs for a specific type (bulk operation)
     * Returns array of favoritable IDs
     */
    public function getUserFavoriteIds(int $userId, string $type): array;
}
