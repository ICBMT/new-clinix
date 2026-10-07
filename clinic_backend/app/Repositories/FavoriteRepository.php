<?php

namespace App\Repositories;

use App\Contracts\FavoriteRepositoryInterface;
use App\Models\Favorite;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class FavoriteRepository extends BaseRepository implements FavoriteRepositoryInterface
{
    protected array $searchableFields = [];

    protected array $filterableFields = [
        'user_id',
        'favoritable_type',
        'favoritable_id',
    ];

    /**
     * Toggle favorite
     */
    public function toggleFavorite(int $userId, string $type, int $itemId): bool
    {
        // Map type to model class
        $modelClass = match($type) {
            'treatment' => \App\Models\Treatment::class,
            'clinic' => \App\Models\Clinic::class,
            'machine' => \App\Models\Machine::class,
            default => null,
        };

        if (!$modelClass) {
            throw new \InvalidArgumentException(__('common.invalid_favorite_type', ['type' => $type]));
        }

        $existing = $this->model->where('user_id', $userId)
            ->where('favoritable_type', $modelClass)
            ->where('favoritable_id', $itemId)
            ->first();

        if ($existing) {
            $existing->delete();
            return false;
        } else {
            $this->model->create([
                'user_id' => $userId,
                'favoritable_type' => $modelClass,
                'favoritable_id' => $itemId,
            ]);
            return true;
        }
    }

    /**
     * Get user favorites
     */
    public function getUserFavorites(int $userId, string $type, int $perPage = 15): LengthAwarePaginator
    {
        // Map type to model class
        $modelClass = match($type) {
            'treatment' => \App\Models\Treatment::class,
            'clinic' => \App\Models\Clinic::class,
            'machine' => \App\Models\Machine::class,
            default => null,
        };

        if (!$modelClass) {
            throw new \InvalidArgumentException(__('common.invalid_favorite_type', ['type' => $type]));
        }

        // Build base query
        $query = $this->model
            ->where('user_id', $userId)
            ->where('favoritable_type', $modelClass);

        // For clinics, join with clinics table to filter approved ones with active owners before pagination
        if ($type === 'clinic') {
            $query->join('clinics', function($join) {
                $join->on('clinics.id', '=', 'favorites.favoritable_id')
                     ->where('clinics.status', '=', 'approved');
            })
            ->join('users', function($join) {
                $join->on('users.id', '=', 'clinics.owner_id')
                     ->where('users.status', '=', 'active');
            });
        }

        // Eager load relationships
        $query->with(['favoritable' => function ($query) use ($type) {
            if ($type === 'treatment') {
                $query->with(['clinic:id,name_en,name_ar', 'category:id,name_en,name_ar', 'media']);
            } elseif ($type === 'clinic') {
                $query->with([
                    'area:id,name_en,name_ar',
                    'governorate:id,name_en,name_ar',
                    'category:id,name_en,name_ar',
                    'media',
                    'owner:id,name,email,phone'
                ]);
            } elseif ($type === 'machine') {
                $query->with(['clinic:id,name_en,name_ar', 'media']);
            }
        }]);

        // Select only favorites columns to avoid conflicts
        if ($type === 'clinic') {
            $query->select('favorites.*');
        }

        $favorites = $query->orderBy('favorites.created_at', 'desc')->paginate($perPage);
        
        // Filter out favorites where favoritable is null (item was deleted)
        $validFavorites = $favorites->getCollection()->filter(function ($favorite) {
            // Ensure favoritable is loaded
            if (!$favorite->relationLoaded('favoritable') || !$favorite->favoritable) {
                // Try to reload if favoritable_id exists
                if ($favorite->favoritable_id && $favorite->favoritable_type) {
                    try {
                        $modelClass = $favorite->favoritable_type;
                        $item = $modelClass::find($favorite->favoritable_id);
                        if ($item) {
                            $favorite->setRelation('favoritable', $item);
                            return true; // Keep this favorite
                        }
                    } catch (\Exception $e) {
                        // Model class doesn't exist or item was deleted
                    }
                }
                return false; // Remove this favorite
            }
            return true; // Keep this favorite
        });
        
        $favorites->setCollection($validFavorites);
        
        return $favorites;
    }

    /**
     * Check if item is favorited
     */
    public function isFavorited(int $userId, string $type, int $itemId): bool
    {
        // Map type to model class
        $modelClass = match($type) {
            'treatment' => \App\Models\Treatment::class,
            'clinic' => \App\Models\Clinic::class,
            'machine' => \App\Models\Machine::class,
            default => null,
        };

        if (!$modelClass) {
            return false;
        }

        return $this->model->where('user_id', $userId)
            ->where('favoritable_type', $modelClass)
            ->where('favoritable_id', $itemId)
            ->exists();
    }

    /**
     * Get user's favorite IDs for a specific type (bulk operation)
     * Returns array of favoritable IDs
     */
    public function getUserFavoriteIds(int $userId, string $type): array
    {
        // Map type to model class
        $modelClass = match($type) {
            'treatment' => \App\Models\Treatment::class,
            'clinic' => \App\Models\Clinic::class,
            'machine' => \App\Models\Machine::class,
            default => null,
        };

        if (!$modelClass) {
            return [];
        }

        return $this->model->where('user_id', $userId)
            ->where('favoritable_type', $modelClass)
            ->pluck('favoritable_id')
            ->toArray();
    }
}

