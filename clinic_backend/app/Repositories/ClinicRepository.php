<?php

namespace App\Repositories;

use App\Contracts\ClinicRepositoryInterface;
use App\Models\Clinic;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ClinicRepository extends BaseRepository implements ClinicRepositoryInterface
{
    protected array $searchableFields = [
        'name_en',
        'name_ar',
        'bio_en',
        'bio_ar',
        'phone',
        'address',
    ];

    protected array $filterableFields = [
        'status',
        'is_featured',
        'area_id',
        'city',
        'owner_id',
    ];

    public function __construct(Clinic $model)
    {
        parent::__construct($model);
    }

    /**
     * Get top clinics
     */
    public function getTopClinics(int $limit = 6): Collection
    {
        return $this->model
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            })
            ->with(['owner:id,name,email,phone', 'area'])
            ->orderBy('average_rating', 'desc')
            ->orderBy('total_bookings', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Search clinics
     */
    public function search(string $query, ?float $latitude = null, ?float $longitude = null, int $radius = 10): Collection
    {
        $query_builder = $this->model->query()
            ->with(['owner:id,name,email,phone', 'area'])
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            });

        // Apply text search
        if ($query) {
            $query_builder->where(function ($q) use ($query) {
                $q->where('name_en', 'LIKE', "%{$query}%")
                  ->orWhere('name_ar', 'LIKE', "%{$query}%")
                  ->orWhere('bio_en', 'LIKE', "%{$query}%")
                  ->orWhere('bio_ar', 'LIKE', "%{$query}%")
                  ->orWhere('phone', 'LIKE', "%{$query}%")
                  ->orWhere('address', 'LIKE', "%{$query}%")
                  ->orWhereHas('owner', function ($ownerQuery) use ($query) {
                      $ownerQuery->where('name', 'LIKE', "%{$query}%")
                                 ->orWhere('email', 'LIKE', "%{$query}%");
                  });
            });
        }

        // Apply location-based search if latitude/longitude provided
        if ($latitude && $longitude) {
            // TODO: Implement location-based search using Haversine formula
            // For now, just return all clinics
        }

        return $query_builder->get();
    }

    /**
     * Get clinics by location
     */
    public function getByLocation(float $latitude, float $longitude, int $radius = 10): array
    {
        // TODO: Implement location-based query using Haversine formula
        return $this->model
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            })
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->toArray();
    }

    /**
     * Get clinic statistics
     */
    public function getClinicStats(int $clinicId): array
    {
        $clinic = $this->model->findOrFail($clinicId);

        $totalTreatments = \App\Models\Treatment::where('clinic_id', $clinicId)
            ->where('status', 'approved')
            ->count();

        $totalBookings = \App\Models\Booking::where('clinic_id', $clinicId)->count();
        $completedBookings = \App\Models\Booking::where('clinic_id', $clinicId)
            ->where('status', 'completed')
            ->count();

        $averageRating = \App\Models\Review::where('clinic_id', $clinicId)
            ->whereNotNull('rating')->avg('rating');

        return [
            'total_treatments' => $totalTreatments,
            'total_bookings' => $totalBookings,
            'completed_bookings' => $completedBookings,
            'average_rating' => $averageRating !== null ? (float) round($averageRating, 2) : 0.0,
            'total_machines' => \App\Models\Machine::where('clinic_id', $clinicId)->count(),
        ];
    }

    /**
     * Find clinic with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Clinic
    {
        $defaultRelations = [
            'owner:id,name,email,phone,status',
            'area:id,name_en,name_ar',
            'governorate:id,name_en,name_ar',
            'category:id,name_en,name_ar',
            'media',
            'treatments' => function($query) {
                $query->where('status', 'approved')
                    ->with(['category:id,name_en,name_ar', 'media'])
                    ->orderBy('is_featured', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit(6); // Limit for preview
            },
            'machines' => function($query) {
                $query->where('status', 'ready')
                    ->with('media')
                    ->orderBy('created_at', 'desc')
                    ->limit(6); // Limit for preview
            },
            'operatingHours'
        ];

        $allRelations = array_merge($defaultRelations, $relations);

        // Return null only if clinic doesn't exist
        // Status and owner validation should be handled by the controller
        return $this->model->with($allRelations)->find($id);
    }

    /**
     * Get clinics owned by user
     */
    public function getByOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['owner:id,name,email,phone', 'area', 'media'])
            ->where('owner_id', $ownerId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get clinics where user is a member
     */
    public function getByUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['owner:id,name,email,phone', 'area', 'media'])
            ->where('owner_id', $userId)
            ->orWhereHas('users', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get nearby clinics based on latitude/longitude
     */
    public function getNearbyClinics(float $latitude, float $longitude, float $radius = 10, int $limit = 10, ?int $categoryId = null): Collection
    {
        $query = $this->model
            ->with(['area', 'owner'])
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            })
            ->where('is_featured', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');
        
        // Filter by category if provided (clinics that have treatments in this category)
        if ($categoryId) {
            $query->whereHas('treatments', function($q) use ($categoryId) {
                $q->where('category_id', $categoryId)
                  ->where('status', 'approved');
            });
        }
        
        return $query
            ->selectRaw("
                clinics.*,
                COALESCE(clinics.average_rating, 0) as average_rating,
                COALESCE(clinics.total_reviews, 0) as total_reviews,
                (6371 * acos(
                    cos(radians(?)) 
                    * cos(radians(clinics.latitude)) 
                    * cos(radians(clinics.longitude) - radians(?)) 
                    + sin(radians(?)) 
                    * sin(radians(clinics.latitude))
                )) AS distance
            ", [$latitude, $longitude, $latitude])
            ->having('distance', '<=', $radius)
            ->orderBy('distance', 'asc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get featured clinics
     */
    public function getFeaturedClinics(int $limit = 10): Collection
    {
        return $this->model
            ->with(['area', 'owner'])
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            })
            ->where('is_featured', true)
            ->orderBy('average_rating', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get active clinics
     */
    public function getActiveClinics(): Collection
    {
        return $this->model
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            })
            ->orderBy('name_en')
            ->get();
    }

    /**
     * Get all clinic IDs
     */
    public function getAllClinicIds(): array
    {
        return $this->model->pluck('id')->toArray();
    }

    /**
     * Filter clinics with advanced filters
     */
    public function filter(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model
            ->with([
                'owner:id,name,email,phone',
                'area:id,name_en,name_ar,governorate_id',
                'area.governorate:id,name_en,name_ar',
                'media',
                'treatments' => function($q) {
                    $q->where('status', 'approved');
                },
                'machines' => function($q) {
                    $q->where('status', 'ready');
                }
            ])
            ->where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            });

        // Search filter
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('name_ar', 'LIKE', "%{$search}%")
                  ->orWhere('bio_en', 'LIKE', "%{$search}%")
                  ->orWhere('bio_ar', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('address', 'LIKE', "%{$search}%")
                  ->orWhereHas('owner', function ($ownerQuery) use ($search) {
                      $ownerQuery->where('name', 'LIKE', "%{$search}%")
                                 ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Category filter - filter clinics that have treatments in this category
        if (isset($filters['category_id']) && $filters['category_id'] !== null && $filters['category_id'] !== '') {
            $categoryId = is_array($filters['category_id']) ? $filters['category_id'] : [(int)$filters['category_id']];
            $query->whereHas('treatments', function($q) use ($categoryId) {
                $q->whereIn('category_id', $categoryId)
                  ->where('status', 'approved');
            });
        }
        if (isset($filters['category_ids']) && !empty($filters['category_ids'])) {
            $categoryIds = is_array($filters['category_ids']) 
                ? array_map('intval', array_filter($filters['category_ids'], fn($id) => $id !== null && $id !== ''))
                : [(int)$filters['category_ids']];
            if (!empty($categoryIds)) {
                $query->whereHas('treatments', function($q) use ($categoryIds) {
                    $q->whereIn('category_id', $categoryIds)
                  ->where('status', 'approved');
            });
            }
        }

        // Treatment IDs filter - filter clinics that have these treatments
        if (isset($filters['treatment_ids']) && !empty($filters['treatment_ids'])) {
            $treatmentIds = is_array($filters['treatment_ids']) 
                ? array_map('intval', array_filter($filters['treatment_ids'], fn($id) => $id !== null && $id !== ''))
                : [(int)$filters['treatment_ids']];
            if (!empty($treatmentIds)) {
                $query->whereHas('treatments', function($q) use ($treatmentIds) {
                    $q->whereIn('treatments.id', $treatmentIds)
                  ->where('status', 'approved');
            });
            }
        }

        // Machine IDs filter - filter clinics that have these machines
        if (isset($filters['machine_ids']) && !empty($filters['machine_ids'])) {
            $machineIds = is_array($filters['machine_ids']) 
                ? array_map('intval', array_filter($filters['machine_ids'], fn($id) => $id !== null && $id !== ''))
                : [(int)$filters['machine_ids']];
            if (!empty($machineIds)) {
                $query->whereHas('machines', function($q) use ($machineIds) {
                    $q->whereIn('machines.id', $machineIds)
                  ->where('status', 'ready');
            });
            }
        }

        // Location filter - support area_id, governorate_id, or text search
        if (isset($filters['area_id']) && $filters['area_id'] !== null && $filters['area_id'] !== '') {
            $areaId = (int)$filters['area_id'];
            if ($areaId > 0) {
                $query->where('area_id', $areaId);
            }
        }
        
        if (isset($filters['governorate_id']) && $filters['governorate_id'] !== null && $filters['governorate_id'] !== '') {
            $governorateId = (int)$filters['governorate_id'];
            if ($governorateId > 0) {
                // Ensure area relationship is loaded for the query
                $query->whereHas('area', function($areaQuery) use ($governorateId) {
                    $areaQuery->where('governorate_id', $governorateId);
                });
            }
        }
        
        
        // Text-based location search (only if area_id and governorate_id are not set or empty)
        // This allows location text search to work independently
        $hasAreaId = isset($filters['area_id']) && !empty($filters['area_id']);
        $hasGovernorateId = isset($filters['governorate_id']) && !empty($filters['governorate_id']);
        
        if (isset($filters['location']) && !empty($filters['location']) && !$hasAreaId && !$hasGovernorateId) {
            $location = trim($filters['location']);
            
            // Normalize the location string: replace hyphens with spaces
            $normalizedLocation = str_replace(['-', '_'], ' ', $location);
            $normalizedLocation = preg_replace('/\s+/', ' ', $normalizedLocation); // Multiple spaces to single
            $normalizedLocation = trim($normalizedLocation);
            
            // Create search terms: original, normalized, and individual words
            $searchTerms = [$location, $normalizedLocation];
            
            // Split into words and add significant words to search terms
            $words = preg_split('/[\s,]+/', $normalizedLocation);
            foreach ($words as $word) {
                $word = trim($word);
                if (!empty($word) && strlen($word) >= 3) {
                    // Filter out common location words
                    $commonWords = ['street', 'st', 'kuwait', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd', 'lane', 'ln'];
                    if (!in_array(strtolower($word), $commonWords)) {
                        $searchTerms[] = $word;
                    }
                }
            }
            
            // Remove duplicates and empty values
            $searchTerms = array_unique(array_filter($searchTerms));
            
            if (!empty($searchTerms)) {
                $query->where(function ($q) use ($searchTerms) {
                    // Search in all location-related fields for any of the search terms
                    foreach ($searchTerms as $term) {
                        $q->orWhere(function($termQuery) use ($term) {
                            $termQuery->where('city', 'LIKE', "%{$term}%")
                              ->orWhere('state', 'LIKE', "%{$term}%")
                              ->orWhere('address', 'LIKE', "%{$term}%")
                              ->orWhere('street', 'LIKE', "%{$term}%")
                              ->orWhere('block', 'LIKE', "%{$term}%")
                              ->orWhere('avenue', 'LIKE', "%{$term}%");
                        });
                    }
                    
                    // Also search in area and governorate names
                    $q->orWhereHas('area', function($areaQuery) use ($searchTerms) {
                        $areaQuery->where(function($areaSubQuery) use ($searchTerms) {
                            foreach ($searchTerms as $term) {
                                $areaSubQuery->orWhere('name_en', 'LIKE', "%{$term}%")
                                            ->orWhere('name_ar', 'LIKE', "%{$term}%");
                            }
                        });
                    })
                    ->orWhereHas('area.governorate', function($govQuery) use ($searchTerms) {
                        $govQuery->where(function($govSubQuery) use ($searchTerms) {
                            foreach ($searchTerms as $term) {
                                $govSubQuery->orWhere('name_en', 'LIKE', "%{$term}%")
                                           ->orWhere('name_ar', 'LIKE', "%{$term}%");
                            }
                        });
                    });
                });
            } else {
                // Fallback to original exact match if no meaningful words found
                $query->where(function ($q) use ($location, $normalizedLocation) {
                $q->where('city', 'LIKE', "%{$location}%")
                  ->orWhere('state', 'LIKE', "%{$location}%")
                  ->orWhere('address', 'LIKE', "%{$location}%")
                      ->orWhere('street', 'LIKE', "%{$location}%")
                      ->orWhere('block', 'LIKE', "%{$location}%")
                      ->orWhere('avenue', 'LIKE', "%{$location}%")
                      ->orWhere('address', 'LIKE', "%{$normalizedLocation}%")
                      ->orWhere('street', 'LIKE', "%{$normalizedLocation}%")
                      ->orWhereHas('area', function($areaQuery) use ($location, $normalizedLocation) {
                      $areaQuery->where('name_en', 'LIKE', "%{$location}%")
                                    ->orWhere('name_ar', 'LIKE', "%{$location}%")
                                    ->orWhere('name_en', 'LIKE', "%{$normalizedLocation}%")
                                    ->orWhere('name_ar', 'LIKE', "%{$normalizedLocation}%");
                  })
                      ->orWhereHas('area.governorate', function($govQuery) use ($location, $normalizedLocation) {
                      $govQuery->where('name_en', 'LIKE', "%{$location}%")
                                   ->orWhere('name_ar', 'LIKE', "%{$location}%")
                                   ->orWhere('name_en', 'LIKE', "%{$normalizedLocation}%")
                                   ->orWhere('name_ar', 'LIKE', "%{$normalizedLocation}%");
                  });
            });
            }
        }

        // Location filter (if latitude/longitude provided)
        if (isset($filters['latitude']) && isset($filters['longitude'])) {
            $latitude = $filters['latitude'];
            $longitude = $filters['longitude'];
            $radius = $filters['radius'] ?? 10;
            
            $query->whereNotNull('latitude')
                  ->whereNotNull('longitude')
                  ->selectRaw("
                      clinics.*,
                      (6371 * acos(
                          cos(radians(?)) 
                          * cos(radians(clinics.latitude)) 
                          * cos(radians(clinics.longitude) - radians(?)) 
                          + sin(radians(?)) 
                          * sin(radians(clinics.latitude))
                      )) AS distance
                  ", [$latitude, $longitude, $latitude])
                  ->having('distance', '<=', $radius)
                  ->orderBy('distance', 'asc');
        }

        // Rating filter - supports array of ratings [1,3,5] or single rating
        $ratingFilter = null;
        if (isset($filters['ratings']) && is_array($filters['ratings']) && !empty($filters['ratings'])) {
            $ratingFilter = $filters['ratings'];
        } elseif (isset($filters['rating']) && is_array($filters['rating']) && !empty($filters['rating'])) {
            $ratingFilter = $filters['rating'];
        } elseif (isset($filters['star_rating']) && is_array($filters['star_rating']) && !empty($filters['star_rating'])) {
            $ratingFilter = $filters['star_rating'];
        } elseif (isset($filters['rating']) && !is_array($filters['rating']) && $filters['rating'] !== null) {
            // Single integer (backward compatibility)
            $ratingFilter = [(int)$filters['rating']];
        } elseif (isset($filters['star_rating']) && !is_array($filters['star_rating']) && $filters['star_rating'] !== null) {
            // Single integer (backward compatibility)
            $ratingFilter = [(int)$filters['star_rating']];
        }
        
        if ($ratingFilter && is_array($ratingFilter) && !empty($ratingFilter)) {
            // Filter by array of ratings - calculate average rating from reviews table
            // Convert to integers and filter out invalid values
            $validRatings = array_filter(array_map('intval', $ratingFilter), fn($r) => $r >= 1 && $r <= 5);
            if (!empty($validRatings)) {
                // For filtering by calculated aggregates (average rating), we need a subquery
                // This is more efficient than using whereHas which would require multiple queries
                // The subquery calculates the average rating from the reviews relationship
                $query->whereIn(
                    DB::raw('FLOOR(COALESCE((
                        SELECT AVG(rating)
                        FROM reviews
                        WHERE reviews.clinic_id = clinics.id
                        AND reviews.deleted_at IS NULL
                        AND (reviews.status = \'approved\' OR reviews.status IS NULL)
                        AND reviews.rating IS NOT NULL
                        AND reviews.rating > 0
                    ), COALESCE(clinics.average_rating, 0)))'),
                    $validRatings
                );
            }
        }

        // Experience filter - filter by clinic years in operation
        if (isset($filters['experience']) && !empty($filters['experience'])) {
            $experience = strtolower(trim($filters['experience']));
            if (str_contains($experience, '1') && str_contains($experience, '3')) {
                $query->whereRaw('TIMESTAMPDIFF(YEAR, clinics.created_at, NOW()) BETWEEN 1 AND 3');
            } elseif (str_contains($experience, '15') || str_contains($experience, '15+')) {
                $query->whereRaw('TIMESTAMPDIFF(YEAR, clinics.created_at, NOW()) >= 15');
            } elseif (str_contains($experience, '10') || str_contains($experience, '10+')) {
                $query->whereRaw('TIMESTAMPDIFF(YEAR, clinics.created_at, NOW()) >= 10');
            } elseif (str_contains($experience, '4') || str_contains($experience, '4+')) {
                $query->whereRaw('TIMESTAMPDIFF(YEAR, clinics.created_at, NOW()) >= 4');
            }
        }

        // Top doctor filter
        if (isset($filters['top_doctor']) && $filters['top_doctor']) {
            $query->where('clinics.average_rating', '>=', 4.5)
                  ->where('clinics.total_reviews', '>=', 10);
        }

        // Price range filter - filter clinics that have treatments in this price range
        if (isset($filters['min_price']) || isset($filters['max_price'])) {
            $minPrice = isset($filters['min_price']) && $filters['min_price'] !== null && $filters['min_price'] !== '' 
                ? (float)$filters['min_price'] : null;
            $maxPrice = isset($filters['max_price']) && $filters['max_price'] !== null && $filters['max_price'] !== '' 
                ? (float)$filters['max_price'] : null;
            
            if ($minPrice !== null || $maxPrice !== null) {
            $query->whereHas('treatments', function($q) use ($minPrice, $maxPrice) {
                    $q->where('status', 'approved')
                      ->where(function($priceQuery) use ($minPrice, $maxPrice) {
                          // A treatment matches if either base_price or final_price is within the range
                          // Check if base_price is in range
                          $priceQuery->where(function($basePriceQuery) use ($minPrice, $maxPrice) {
                              if ($minPrice !== null && $minPrice > 0) {
                                  $basePriceQuery->where('base_price', '>=', $minPrice);
                              }
                              if ($maxPrice !== null && $maxPrice > 0) {
                                  $basePriceQuery->where('base_price', '<=', $maxPrice);
                              }
                          })
                          // OR check if final_price is in range
                          ->orWhere(function($finalPriceQuery) use ($minPrice, $maxPrice) {
                              if ($minPrice !== null && $minPrice > 0) {
                                  $finalPriceQuery->where('final_price', '>=', $minPrice);
                              }
                              if ($maxPrice !== null && $maxPrice > 0) {
                                  $finalPriceQuery->where('final_price', '<=', $maxPrice);
                              }
                          });
                      });
                });
            }
        }

        // Discount filter - filter clinics that have discounted treatments
        if (isset($filters['is_discounted']) && $filters['is_discounted']) {
            $query->whereHas('treatments', function($q) {
                $q->where('status', 'approved')
                  ->where('has_discount', true);
            });
        }

        // Sort by
        $sortBy = $filters['sort_by'] ?? 'newest';
        
        // If distance was calculated (location filter with lat/lng), preserve it in sorting
        $hasDistance = isset($filters['latitude']) && isset($filters['longitude']);
        
        switch ($sortBy) {
            case 'newest':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('created_at', 'desc');
                } else {
                    $query->orderBy('created_at', 'desc');
                }
                break;
            case 'popularity':
            case 'most_popular':
            case 'best_selling':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('total_bookings', 'desc')
                          ->orderBy('average_rating', 'desc');
                } else {
                    $query->orderBy('total_bookings', 'desc')
                          ->orderBy('average_rating', 'desc');
                }
                break;
            case 'price_asc':
            case 'lowest_price':
                // Sort by minimum treatment price
                $query->withMin('treatments', 'base_price')
                      ->orderBy('treatments_min_base_price', 'asc')
                      ->orderBy('clinics.id', 'asc'); // Secondary sort for consistency
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc');
                }
                break;
            case 'price_desc':
            case 'highest_price':
                // Sort by maximum treatment price
                $query->withMax('treatments', 'base_price')
                      ->orderBy('treatments_max_base_price', 'desc')
                      ->orderBy('clinics.id', 'desc'); // Secondary sort for consistency
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc');
                }
                break;
            case 'rating':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('average_rating', 'desc')
                          ->orderBy('total_reviews', 'desc');
                } else {
                    $query->orderBy('average_rating', 'desc')
                          ->orderBy('total_reviews', 'desc');
                }
                break;
            default:
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('created_at', 'desc');
                } else {
                    $query->orderBy('created_at', 'desc');
                }
                break;
        }

        return $query->paginate($perPage);
    }

    /**
     * Get approved clinics for dropdown
     * Returns clinics that are approved, optionally filtered by accessible clinic IDs
     */
    public function getApprovedClinicsForDropdown(?array $accessibleClinicIds = null): Collection
    {
        $query = $this->model->where('status', 'approved');

        if ($accessibleClinicIds !== null && !empty($accessibleClinicIds)) {
            $query->whereIn('id', $accessibleClinicIds);
        }

        return $query->orderBy('name_en')->get(['id', 'name_en', 'name_ar']);
    }
}
