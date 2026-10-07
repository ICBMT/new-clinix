<?php

namespace App\Repositories;

use App\Contracts\MachineRepositoryInterface;
use App\Models\Machine;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MachineRepository extends BaseRepository implements MachineRepositoryInterface
{
    protected array $searchableFields = [
        'model_en',
        'model_ar',
        'serial_number',
        'manufacturer_en',
        'manufacturer_ar',
        'description_en',
        'description_ar',
    ];

    protected array $filterableFields = [
        'clinic_id',
        'vendor_id', // Backward compatibility
        'status',
    ];

    public function __construct(Machine $model)
    {
        parent::__construct($model);
    }

    /**
     * Get machines by clinic
     */
    public function getByClinic(int $clinicId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['clinic:id,name_en,name_ar', 'media'])
            ->where('clinic_id', $clinicId)
            ->where('status', 'ready')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Alias for backward compatibility
     */
    public function getByVendor(int $vendorId, int $perPage = 15): LengthAwarePaginator
    {
        // Find clinic by owner_id
        $clinic = \App\Models\Clinic::where('owner_id', $vendorId)->first();
        if (!$clinic) {
            return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage);
        }
        return $this->getByClinic($clinic->id, $perPage);
    }

    /**
     * Get machine with full details
     */
    public function getMachineWithFullDetails(int $id): ?Machine
    {
        return $this->model
            ->with([
                'clinic' => function ($query) {
                    $query->with([
                        'operatingHours',
                        'area:id,name_en,name_ar',
                        'governorate:id,name_en,name_ar',
                        'owner:id,name,email,status'
                    ]);
                },
                'category:id,name_en,name_ar', // Keep for backward compatibility
                'categories:id,name_en,name_ar', // Multiple categories
                'treatments' => function ($query) {
                    $query->with(['category:id,name_en,name_ar', 'media'])
                          ->where('status', 'approved')
                          ->limit(6); // Limit for preview
                },
                'media'
            ])
            ->find($id);
    }

    /**
     * Get treatments for a machine
     */
    public function getMachineTreatments(int $machineId, int $perPage = 15): LengthAwarePaginator
    {
        $machine = $this->model->findOrFail($machineId);
        
        return $machine->treatments()
            ->with(['clinic:id,name_en,name_ar', 'category:id,name_en,name_ar', 'media'])
            ->where('status', 'approved')
            ->paginate($perPage);
    }

    /**
     * Search machines
     */
    public function search(string $query, ?int $vendorId = null): Collection
    {
        $queryBuilder = $this->model->query()
            ->with(['clinic:id,name_en,name_ar', 'media']);

        if ($vendorId) {
            $queryBuilder->where('vendor_id', $vendorId);
        }

        if ($query) {
            $queryBuilder->where(function ($q) use ($query) {
                $q->where('model_en', 'LIKE', "%{$query}%")
                  ->orWhere('model_ar', 'LIKE', "%{$query}%")
                  ->orWhere('serial_number', 'LIKE', "%{$query}%")
                  ->orWhere('manufacturer_en', 'LIKE', "%{$query}%")
                  ->orWhere('manufacturer_ar', 'LIKE', "%{$query}%")
                  ->orWhere('description_en', 'LIKE', "%{$query}%")
                  ->orWhere('description_ar', 'LIKE', "%{$query}%");
            });
        }

        return $queryBuilder->get();
    }

    /**
     * Get machines by status
     */
    public function getByStatus(string $status, ?int $vendorId = null): Collection
    {
        $queryBuilder = $this->model->query()
            ->with(['vendor:id,name', 'media'])
            ->where('status', $status);

        if ($vendorId) {
            $queryBuilder->where('vendor_id', $vendorId);
        }

        return $queryBuilder->get();
    }

    /**
     * Get ready machines by vendor
     */
    public function getReadyByVendor(int $vendorId): Collection
    {
        return $this->model
            ->with(['media'])
            ->whereHas('clinic', function ($q) use ($vendorId) {
                $q->where('owner_id', $vendorId);
            })
            ->where('status', 'ready')
            ->get();
    }

    /**
     * Get all machines
     */
    public function all(): Collection
    {
        return $this->model
            ->with(['clinic:id,name_en,name_ar', 'media'])
            ->get();
    }

    /**
     * Get ready machines for home page
     */
    public function getReadyMachines(int $limit = 10): Collection
    {
        return $this->model
            ->with([
                'clinic' => function($q) {
                    $q->where('status', 'approved')
                      ->whereHas('owner', function($ownerQuery) {
                          $ownerQuery->where('status', 'active');
                      });
                },
                'media' => function($q) {
                    $q->where('collection_name', 'images')->orderBy('created_at', 'desc');
                }
            ])
            ->where('status', 'ready')
            ->whereHas('clinic', function($q) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  });
            })
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get clinics that have a specific machine
     * 
     * Returns all clinics that have the same machine model (same model_en/model_ar)
     * This is useful when admin adds a machine and multiple clinics add that machine to their clinic
     */
    public function getMachineClinics(int $machineId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $machine = $this->model->findOrFail($machineId);
        
        // Get all clinics that have this machine model (same model_en/model_ar)
        $query = \App\Models\Clinic::whereHas('machines', function($q) use ($machine) {
                $q->where('model_en', $machine->model_en)
                  ->where('status', 'ready');
            })
            ->where('status', 'approved');

        // Location filter (text search)
        if (isset($filters['location']) && !empty($filters['location'])) {
            $location = $filters['location'];
            $query->where(function ($q) use ($location) {
                $q->where('city', 'LIKE', "%{$location}%")
                  ->orWhere('state', 'LIKE', "%{$location}%")
                  ->orWhere('address', 'LIKE', "%{$location}%")
                  ->orWhereHas('area', function($areaQuery) use ($location) {
                      $areaQuery->where('name_en', 'LIKE', "%{$location}%")
                                ->orWhere('name_ar', 'LIKE', "%{$location}%");
                  });
            });
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
                  ->having('distance', '<=', $radius);
        }

        // Rating filter
        if (isset($filters['rating'])) {
            $query->where('average_rating', '>=', $filters['rating']);
        }

        // Eager load relationships
        $query->with([
            'owner:id,name,email',
            'area:id,name_en,name_ar',
            'machines' => function($q) use ($machine) {
                $q->where('model_en', $machine->model_en)
                  ->where('status', 'ready')
                  ->with('media');
            }
        ]);

        // Sort by
        $sortBy = $filters['sort_by'] ?? 'rating';
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
            case 'rating':
            default:
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('average_rating', 'desc')
                          ->orderBy('total_reviews', 'desc');
                } else {
                    $query->orderBy('average_rating', 'desc')
                          ->orderBy('total_reviews', 'desc');
                }
                break;
            case 'popularity':
                if ($hasDistance) {
                    $query->orderBy('distance', 'asc')
                          ->orderBy('total_bookings', 'desc')
                          ->orderBy('average_rating', 'desc');
                } else {
                    $query->orderBy('total_bookings', 'desc')
                          ->orderBy('average_rating', 'desc');
                }
                break;
        }

        return $query->paginate($perPage);
    }

    /**
     * Filter machines with pagination
     */
    public function filter(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Default to ready status
        // Include: global machines (clinic_id IS NULL) OR machines from approved clinics with active owners
        $query->where('status', 'ready')
              ->where(function($q) {
                  // Global machines (no clinic assigned) - these are always available
                  $q->whereNull('clinic_id')
                    // OR machines from approved clinics with active owners
                    ->orWhereHas('clinic', function($clinicQuery) {
                        $clinicQuery->where('status', 'approved')
                          ->whereHas('owner', function($ownerQuery) {
                              $ownerQuery->where('status', 'active');
                          });
                    });
              });

        // Search filter
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('model_en', 'LIKE', "%{$search}%")
                  ->orWhere('model_ar', 'LIKE', "%{$search}%")
                  ->orWhere('manufacturer_en', 'LIKE', "%{$search}%")
                  ->orWhere('manufacturer_ar', 'LIKE', "%{$search}%")
                  ->orWhere('serial_number', 'LIKE', "%{$search}%")
                  ->orWhere('description_en', 'LIKE', "%{$search}%")
                  ->orWhere('description_ar', 'LIKE', "%{$search}%")
                  ->orWhereHas('clinic', function($clinicQuery) use ($search) {
                      $clinicQuery->where('name_en', 'LIKE', "%{$search}%")
                                  ->orWhere('name_ar', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Status filter (override default if specified)
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Category filter - filter machines by categories
        // Support both direct category_id field (backward compatibility) and many-to-many categories relationship
        // Handle both category_id and category_ids (category_ids takes precedence if both are set)
        $categoryIdsToFilter = null;
        
        if (isset($filters['category_ids']) && !empty($filters['category_ids'])) {
            $categoryIdsToFilter = is_array($filters['category_ids']) 
                ? array_map('intval', array_filter($filters['category_ids'], fn($id) => $id !== null && $id !== '' && $id > 0))
                : [(int)$filters['category_ids']];
            $categoryIdsToFilter = array_filter($categoryIdsToFilter, fn($id) => $id > 0);
        } elseif (isset($filters['category_id']) && $filters['category_id'] !== null && $filters['category_id'] !== '') {
            $categoryId = (int)$filters['category_id'];
            if ($categoryId > 0) {
                $categoryIdsToFilter = [$categoryId];
            }
        }
        
        if (!empty($categoryIdsToFilter)) {
            $query->where(function($q) use ($categoryIdsToFilter) {
                // Check direct category_id field (backward compatibility)
                $q->whereIn('category_id', $categoryIdsToFilter)
                  // OR check many-to-many categories relationship
                  ->orWhereHas('categories', function($categoryQuery) use ($categoryIdsToFilter) {
                      $categoryQuery->whereIn('categories.id', $categoryIdsToFilter);
                  });
            });
        }

        // Treatment IDs filter - filter machines from clinics that have these treatments
        if (isset($filters['treatment_ids']) && !empty($filters['treatment_ids'])) {
            $query->whereHas('treatments', function($q) use ($filters) {
                $q->whereIn('treatments.id', $filters['treatment_ids'])
                  ->where('status', 'approved');
            });
        }

        // Machine IDs filter
        if (isset($filters['machine_ids']) && !empty($filters['machine_ids'])) {
            $query->whereIn('id', $filters['machine_ids']);
        }

        // Manufacturer filter
        if (isset($filters['manufacturer'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('manufacturer_en', 'like', "%{$filters['manufacturer']}%")
                  ->orWhere('manufacturer_ar', 'like', "%{$filters['manufacturer']}%");
            });
        }

        // Clinic ID filter
        if (isset($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }

        // Vendor ID filter
        if (isset($filters['vendor_id'])) {
            $query->whereHas('clinic', function ($q) use ($filters) {
                $q->where('owner_id', $filters['vendor_id']);
            });
        }

        // Location filter - support area_id, governorate_id, or text search
        if (isset($filters['area_id']) && !empty($filters['area_id'])) {
            $query->whereHas('clinic', function ($q) use ($filters) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->where('area_id', $filters['area_id']);
            });
        }
        
        if (isset($filters['governorate_id']) && !empty($filters['governorate_id'])) {
            $query->whereHas('clinic', function ($q) use ($filters) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->whereHas('area', function($areaQuery) use ($filters) {
                      $areaQuery->where('governorate_id', $filters['governorate_id']);
                  });
            });
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
                $query->whereHas('clinic', function ($q) use ($searchTerms) {
                    $q->where('status', 'approved')
                      ->whereHas('owner', function($ownerQuery) {
                          $ownerQuery->where('status', 'active');
                      })
                      ->where(function($locationQuery) use ($searchTerms) {
                          // Search in all location-related fields for any of the search terms
                          foreach ($searchTerms as $index => $term) {
                              if ($index === 0) {
                                  $locationQuery->where(function($termQuery) use ($term) {
                                      $termQuery->where('city', 'LIKE', "%{$term}%")
                                        ->orWhere('state', 'LIKE', "%{$term}%")
                                        ->orWhere('address', 'LIKE', "%{$term}%")
                                        ->orWhere('street', 'LIKE', "%{$term}%")
                                        ->orWhere('block', 'LIKE', "%{$term}%")
                                        ->orWhere('avenue', 'LIKE', "%{$term}%");
                                  });
                              } else {
                                  $locationQuery->orWhere(function($termQuery) use ($term) {
                                      $termQuery->where('city', 'LIKE', "%{$term}%")
                                        ->orWhere('state', 'LIKE', "%{$term}%")
                                        ->orWhere('address', 'LIKE', "%{$term}%")
                                        ->orWhere('street', 'LIKE', "%{$term}%")
                                        ->orWhere('block', 'LIKE', "%{$term}%")
                                        ->orWhere('avenue', 'LIKE', "%{$term}%");
                                  });
                              }
                          }
                          
                          // Also search in area and governorate names
                          $locationQuery->orWhereHas('area', function($areaQuery) use ($searchTerms) {
                              $areaQuery->where(function($areaSubQuery) use ($searchTerms) {
                                  foreach ($searchTerms as $index => $term) {
                                      if ($index === 0) {
                                          $areaSubQuery->where('name_en', 'LIKE', "%{$term}%")
                                                      ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      } else {
                                          $areaSubQuery->orWhere('name_en', 'LIKE', "%{$term}%")
                                                      ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      }
                                  }
                              });
                          })
                          ->orWhereHas('area.governorate', function($govQuery) use ($searchTerms) {
                              $govQuery->where(function($govSubQuery) use ($searchTerms) {
                                  foreach ($searchTerms as $index => $term) {
                                      if ($index === 0) {
                                          $govSubQuery->where('name_en', 'LIKE', "%{$term}%")
                                                     ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      } else {
                                          $govSubQuery->orWhere('name_en', 'LIKE', "%{$term}%")
                                                     ->orWhere('name_ar', 'LIKE', "%{$term}%");
                                      }
                                  }
                              });
                          });
                      });
                });
            }
        }

        // Location filter (if latitude/longitude provided)
        if (isset($filters['latitude']) && isset($filters['longitude'])) {
            $latitude = $filters['latitude'];
            $longitude = $filters['longitude'];
            $radius = $filters['radius'] ?? 10;
            
            $query->whereHas('clinic', function($q) use ($latitude, $longitude, $radius) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->whereNotNull('latitude')
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
                  ->having('distance', '<=', $radius);
            });
        }

        // Rating filter - filter machines from clinics with rating(s) - supports array [1,3] or single rating
        if (isset($filters['ratings']) && is_array($filters['ratings']) && !empty($filters['ratings'])) {
            // Filter by array of ratings - match clinics where FLOOR(average_rating) is in the array
            $query->whereHas('clinic', function($q) use ($filters) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->whereIn(\DB::raw('FLOOR(average_rating)'), $filters['ratings']);
            });
        } elseif (isset($filters['rating']) || isset($filters['star_rating'])) {
            $ratingValue = $filters['star_rating'] ?? $filters['rating'] ?? null;
            if ($ratingValue) {
                if (is_array($ratingValue) && !empty($ratingValue)) {
                    // Array format
                    $query->whereHas('clinic', function($q) use ($ratingValue) {
                        $q->where('status', 'approved')
                          ->whereHas('owner', function($ownerQuery) {
                              $ownerQuery->where('status', 'active');
                          })
                          ->whereIn(\DB::raw('FLOOR(average_rating)'), $ratingValue);
                    });
                } else {
                    // Single integer (backward compatibility)
                    $query->whereHas('clinic', function($q) use ($ratingValue) {
                        $q->where('status', 'approved')
                          ->whereHas('owner', function($ownerQuery) {
                              $ownerQuery->where('status', 'active');
                          })
                          ->where('average_rating', '>=', $ratingValue);
                    });
                }
            }
        }

        // Experience filter - filter machines from clinics with specific experience
        if (isset($filters['experience']) && !empty($filters['experience'])) {
            $experience = strtolower(trim($filters['experience']));
            $query->whereHas('clinic', function($q) use ($experience) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  });
                if (str_contains($experience, '1') && str_contains($experience, '3')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) BETWEEN 1 AND 3');
                } elseif (str_contains($experience, '15') || str_contains($experience, '15+')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) >= 15');
                } elseif (str_contains($experience, '10') || str_contains($experience, '10+')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) >= 10');
                } elseif (str_contains($experience, '4') || str_contains($experience, '4+')) {
                    $q->whereRaw('TIMESTAMPDIFF(YEAR, created_at, NOW()) >= 4');
                }
            });
        }

        // Top doctor filter - filter machines from top-rated clinics
        if (isset($filters['top_doctor']) && $filters['top_doctor']) {
            $query->whereHas('clinic', function($q) {
                $q->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->where('average_rating', '>=', 4.5)
                  ->where('total_reviews', '>=', 10);
            });
        }

        // Price range filter - filter machines from clinics that have treatments in this price range
        if (isset($filters['min_price']) || isset($filters['max_price'])) {
            $query->whereHas('clinic', function($clinicQuery) use ($filters) {
                $clinicQuery->where('status', 'approved')
                  ->whereHas('owner', function($ownerQuery) {
                      $ownerQuery->where('status', 'active');
                  })
                  ->whereHas('treatments', function($q) use ($filters) {
                $q->where('status', 'approved');
                if (isset($filters['min_price'])) {
                    $q->where('base_price', '>=', $filters['min_price']);
                }
                if (isset($filters['max_price'])) {
                    $q->where('base_price', '<=', $filters['max_price']);
                }
                  });
            });
        }

        // Discount filter - filter machines from clinics that have discounted treatments
        if (isset($filters['is_discounted']) && $filters['is_discounted']) {
            $query->whereHas('clinic.treatments', function($q) {
                $q->where('status', 'approved')
                  ->where('has_discount', true);
            });
        }

        // Load relationships
        // Note: with() constraints don't filter main query, only what gets loaded
        $query->with([
            'clinic' => function($q) {
                // Only load clinic if it's approved (doesn't filter main query)
                $q->where('status', 'approved')
                  ->with(['owner:id,name,email', 'area:id,name_en,name_ar']);
            },
            'category:id,name_en,name_ar', // Keep for backward compatibility
            'categories:id,name_en,name_ar', // Multiple categories
            'media'
        ]);

        // Sort by
        $sortBy = $filters['sort_by'] ?? 'newest';
        
        // Get table name
        $tableName = $this->model->getTable();
        
        // Check if we already have a join (from location filter with lat/lng)
        $hasJoin = false;
        $joins = $query->getQuery()->joins ?? [];
        foreach ($joins as $join) {
            if (isset($join->table) && $join->table === 'clinics') {
                $hasJoin = true;
                break;
            }
        }
        
        switch ($sortBy) {
            case 'newest':
                $query->orderBy("{$tableName}.created_at", 'desc');
                break;
            case 'popularity':
            case 'most_popular':
            case 'best_selling':
                // Sort by clinic popularity using join
                if (!$hasJoin) {
                    $query->join('clinics', "{$tableName}.clinic_id", '=', 'clinics.id');
                }
                $query->orderBy('clinics.total_bookings', 'desc')
                      ->orderBy('clinics.average_rating', 'desc')
                      ->orderBy("{$tableName}.created_at", 'desc')
                      ->select("{$tableName}.*");
                break;
            case 'price_asc':
            case 'lowest_price':
                // Sort by minimum treatment price from clinic using subquery
                $query->addSelect([
                    'min_treatment_price' => \App\Models\Treatment::selectRaw('MIN(base_price)')
                        ->whereColumn('clinic_id', "{$tableName}.clinic_id")
                        ->where('status', 'approved')
                ])
                ->orderBy('min_treatment_price', 'asc')
                ->orderBy("{$tableName}.created_at", 'desc');
                break;
            case 'price_desc':
            case 'highest_price':
                // Sort by maximum treatment price from clinic using subquery
                $query->addSelect([
                    'max_treatment_price' => \App\Models\Treatment::selectRaw('MAX(base_price)')
                        ->whereColumn('clinic_id', "{$tableName}.clinic_id")
                        ->where('status', 'approved')
                ])
                ->orderBy('max_treatment_price', 'desc')
                ->orderBy("{$tableName}.created_at", 'desc');
                break;
            case 'rating':
                // Sort by clinic rating using join
                if (!$hasJoin) {
                    $query->join('clinics', "{$tableName}.clinic_id", '=', 'clinics.id');
                }
                $query->orderBy('clinics.average_rating', 'desc')
                      ->orderBy('clinics.total_reviews', 'desc')
                      ->orderBy("{$tableName}.created_at", 'desc')
                      ->select("{$tableName}.*");
                break;
            default:
                $query->orderBy("{$tableName}.created_at", 'desc');
                break;
        }

        return $query->paginate($perPage);
    }

    /**
     * Get available machines for a treatment on a specific date
     */
    public function getAvailableMachinesForTreatment(int $treatmentId, string $date): Collection
    {
        // Get the treatment to find its clinic
        $treatment = \App\Models\Treatment::findOrFail($treatmentId);

        // Get machines that:
        // 1. Are associated with this treatment (through machine_treatment pivot)
        // 2. Belong to the same clinic as the treatment OR are global (clinic_id is null)
        // 3. Have status 'ready' (not busy or maintenance)
        // 4. Are not fully booked on the specified date
        
        $query = $this->model
            ->whereHas('treatments', function($q) use ($treatmentId) {
                $q->where('treatments.id', $treatmentId);
            })
            ->where(function($q) use ($treatment) {
                // Include machines from the same clinic OR global machines (clinic_id is null)
                $q->where('clinic_id', $treatment->clinic_id)
                  ->orWhereNull('clinic_id');
            })
            ->where('status', 'ready')
            ->whereDoesntHave('bookings', function($q) use ($date, $treatmentId) {
                // Exclude machines that have bookings on this date
                // Only check bookings for this specific treatment
                $q->where('treatment_id', $treatmentId)
                  ->whereIn('status', ['pending', 'under_review', 'confirmed'])
                  ->whereHas('sessions', function($sessionQuery) use ($date) {
                      $sessionQuery->whereDate('slot_date', $date)
                                   ->whereNotNull('slot_time');
                  });
            })
            ->with(['media', 'clinic:id,name_en,name_ar']);

        return $query->get();
    }

    /**
     * Get machines visible to a specific clinic
     * Returns global machines (clinic_id = null) and clinic-specific machines
     */
    public function getMachinesForClinic(int $clinicId): Collection
    {
        return $this->model
            ->where(function($query) use ($clinicId) {
                $query->whereNull('clinic_id') // Global machines (admin-created)
                      ->orWhere('clinic_id', $clinicId); // Clinic-specific machines
            })
            ->where('status', 'ready')
            ->with(['media', 'category:id,name_en,name_ar'])
            ->get();
    }

    /**
     * Get machines by IDs
     */
    public function getByIds(array $ids): Collection
    {
        if (empty($ids)) {
            return collect([]);
        }
        
        return $this->model->whereIn('id', $ids)->get();
    }

    /**
     * Get machines accessible to a user based on their role
     */
    public function getMachinesForUser(\App\Models\User $user, ?array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Apply role-based clinic filtering using User helper methods
        // Machines can be global (clinic_id = null) or belong to a clinic
        $accessibleClinicIds = $user->getAccessibleClinicIds();
        
        if (empty($accessibleClinicIds)) {
            // Super admin: empty array means no filter (access all machines including global)
            // No additional filtering needed
        } else {
            // For clinic role: show global machines (created by admin, no clinic assigned) + their own machines
            // For clinic manager: show global machines + machines from assigned clinics
            $approvedClinicIds = \App\Models\Clinic::whereIn('id', $accessibleClinicIds)
                ->where('status', 'approved')
                ->pluck('id')
                ->toArray();
            
            $query->where(function($q) use ($approvedClinicIds) {
                $q->whereNull('clinic_id') // Global machines (no clinic assigned, created by admin)
                  ->orWhereIn('clinic_id', $approvedClinicIds); // Machines from approved accessible clinics
            });
        }

        // Apply search filter
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('model_en', 'LIKE', "%{$search}%")
                  ->orWhere('model_ar', 'LIKE', "%{$search}%")
                  ->orWhere('manufacturer_en', 'LIKE', "%{$search}%")
                  ->orWhere('manufacturer_ar', 'LIKE', "%{$search}%")
                  ->orWhere('serial_number', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Apply clinic filter
        if (isset($filters['clinic_id']) && !empty($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }

        // Apply treatment filter - filter machines that have these treatments
        if (isset($filters['treatment_id']) && !empty($filters['treatment_id'])) {
            $treatmentId = is_array($filters['treatment_id']) 
                ? $filters['treatment_id'] 
                : [(int)$filters['treatment_id']];
            $treatmentId = array_filter(array_map('intval', $treatmentId), fn($id) => $id > 0);
            
            if (!empty($treatmentId)) {
                $query->whereHas('treatments', function($q) use ($treatmentId) {
                    $q->whereIn('treatments.id', $treatmentId)
                      ->where('status', 'approved');
                });
            }
        }

        // Load relationships with treatment count
        $query->with([
            'clinic' => function ($query) {
                $query->select('id', 'name_en', 'name_ar', 'email', 'phone', 'logo')
                    ->with(['owner:id,name,email,phone']);
            },
            'category:id,name_en,name_ar', // Keep for backward compatibility
            'categories:id,name_en,name_ar', // Multiple categories
            'media'
        ])
            ->withCount('treatments');

        // Order by
        $query->orderBy('created_at', 'desc');

        return $query->paginate($perPage);
    }

    /**
     * Get accessible machines for treatment creation
     * Returns ready machines that are either global (clinic_id = null) or from approved accessible clinics
     */
    public function getAccessibleMachinesForTreatmentCreation(?array $accessibleClinicIds = null): Collection
    {
        $query = $this->model->where('status', 'ready');

        if ($accessibleClinicIds !== null && !empty($accessibleClinicIds)) {
            // Get approved clinic IDs from accessible clinics
            $approvedClinicIds = \App\Models\Clinic::whereIn('id', $accessibleClinicIds)
                ->where('status', 'approved')
                ->pluck('id')
                ->toArray();

            $query->where(function($q) use ($approvedClinicIds) {
                $q->whereNull('clinic_id') // Global machines
                  ->orWhereIn('clinic_id', $approvedClinicIds); // Machines from approved accessible clinics
            });
        }
        // Super admin: no filtering (sees all machines)

        return $query->select('id', 'model_en', 'model_ar', 'manufacturer_en', 'manufacturer_ar', 'clinic_id')
            ->orderBy('model_en')
            ->get();
    }
}

