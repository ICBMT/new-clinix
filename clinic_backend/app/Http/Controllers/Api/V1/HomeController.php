<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Home\SearchRequest;
use App\Http\Resources\Api\V1\Home\BannerResource;
use App\Http\Resources\Api\V1\Home\CategoryResource;
use App\Http\Resources\Api\V1\Home\TreatmentResource;
use App\Http\Resources\Api\V1\Home\ClinicResource;
use App\Http\Resources\Api\V1\Home\MachineResource;
use App\Http\Resources\Api\V1\Machine\MachineResource as DetailedMachineResource;
use App\Http\Resources\Api\V1\Booking\BookingResource;
use App\Contracts\BannerRepositoryInterface;
use App\Contracts\CategoryRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\MachineRepositoryInterface;
use App\Contracts\BookingRepositoryInterface;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HomeController extends Controller
{
    public function __construct(
        private readonly BannerRepositoryInterface $bannerRepository,
        private readonly CategoryRepositoryInterface $categoryRepository,
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly MachineRepositoryInterface $machineRepository,
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly \App\Contracts\GovernorateRepositoryInterface $governorateRepository,
        private readonly \App\Contracts\AreaRepositoryInterface $areaRepository
    ) {}

    /**
     * Get home page data
     */
    public function index(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            // Get user greeting if authenticated
            $user = $request->user();
            $userData = null;
            if ($user) {
                $userData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email ?? null,
                ];
            }

            // Get active banners
            $banners = $this->bannerRepository->findBy(['status' => 'active'], 10);
            $banners = $banners ? collect($banners) : collect([]);

            // Get featured categories
            $categories = $this->categoryRepository->getFeaturedCategories(8);

            // Get nearby clinics (if latitude/longitude provided)
            $latitude = $request->input('latitude');
            $longitude = $request->input('longitude');
            $radius = $request->input('radius', 10); // Default 10km
            $categoryId = $request->input('category_id'); // Optional category filter
            
            $nearbyClinics = collect([]);
            if ($latitude && $longitude) {
                $nearbyClinics = $this->clinicRepository->getNearbyClinics($latitude, $longitude, $radius, 10, $categoryId);
            } else {
                // If no location provided, get featured clinics
                // If category is provided, filter featured clinics by category using clinic relationship
                if ($categoryId) {
                    $nearbyClinics = $this->clinicRepository->getFeaturedClinics(10)
                        ->filter(function($clinic) use ($categoryId) {
                            return $clinic->treatments()
                                ->where('category_id', $categoryId)
                                ->where('status', 'approved')
                                ->exists();
                        });
                } else {
                    $nearbyClinics = $this->clinicRepository->getFeaturedClinics(10);
                }
            }

            // Get machines (ready status)
            $machines = $this->machineRepository->getReadyMachines(10);

            // Get upcoming bookings for authenticated user using user relationship
            $upcomingBookings = collect([]);
            if ($user) {
                // Use user's bookings relationship for optimal performance
                $upcomingBookings = $user->bookings()
                    ->with([
                        'treatment' => function($q) {
                            $q->with(['media']);
                        },
                        'clinic' => function($q) {
                            $q->with(['media']);
                        },
                        'machine' => function($q) {
                            $q->with(['media']);
                        },
                        'sessions' => function($q) {
                            $q->orderBy('slot_date', 'asc')->orderBy('slot_time', 'asc');
                        },
                    ])
                    ->whereIn('status', ['upcoming', 'accepted'])
                    ->whereHas('sessions')
                    ->whereDoesntHave('sessions', function($q) {
                        $q->where('slot_date', '<', now()->toDateString());
                    })
                    ->withMin('sessions', 'slot_date')
                    ->orderBy('sessions_min_slot_date', 'asc')
                    ->limit(5)
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData,
                    'banners' => BannerResource::collection($banners),
                    'categories' => CategoryResource::collection($categories),
                    'nearby_clinics' => ClinicResource::collection($nearbyClinics),
                    'machines' => MachineResource::collection($machines),
                    'upcoming_bookings' => BookingResource::collection($upcomingBookings),
                ]
            ]);
        });
    }

    /**
     * Search treatments with advanced filters
     */
    public function search(SearchRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Build filters array
            $filters = [
                'search' => $data['search'] ?? '',
                'category_id' => $data['category_id'] ?? null,
                'category_ids' => isset($data['category_id']) && $data['category_id'] ? [$data['category_id']] : null,
                'clinic_id' => $data['clinic_id'] ?? null,
                'treatment_ids' => $data['treatment_ids'] ?? null,
                'machine_ids' => $data['machine_ids'] ?? null,
                'experience' => $data['experience'] ?? null,
                'min_price' => isset($data['min_price']) ? (float)$data['min_price'] : null,
                'max_price' => isset($data['max_price']) ? (float)$data['max_price'] : null,
                // Normalize rating filter - prioritize rating, fallback to star_rating, ensure array format
                'ratings' => $this->normalizeRatingFilter($data['rating'] ?? $data['star_rating'] ?? null),
                'rating' => $data['rating'] ?? null,
                'star_rating' => $data['star_rating'] ?? null,
                'top_doctor' => $data['top_doctor'] ?? false,
                'sort_by' => $this->mapSortBy($data['sort_by'] ?? 'newest'),
                'location' => $data['location'] ?? null,
                'area_id' => $data['area_id'] ?? null,
                'governorate_id' => $data['governorate_id'] ?? null,
                'latitude' => isset($data['latitude']) ? (float)$data['latitude'] : null,
                'longitude' => isset($data['longitude']) ? (float)$data['longitude'] : null,
                'radius' => isset($data['radius']) ? (float)$data['radius'] : 10,
            ];

            // Add is_discounted filter
            if (isset($data['is_discounted']) && $data['is_discounted']) {
                $filters['is_discounted'] = true;
            }

            // Remove null values and empty strings (but keep false for top_doctor and empty arrays)
            $filters = array_filter($filters, function($value) {
                if ($value === false) {
                    return true; // Keep false values (e.g., top_doctor)
                }
                if (is_array($value) && empty($value)) {
                    return false; // Remove empty arrays
                }
                return $value !== null && $value !== '';
            });

            $perPage = isset($data['per_page']) ? (int)$data['per_page'] : 20;
            $type = $data['type'] ?? null;

            $typesToSearch = $this->resolveSearchTypes($type);
            $resultSets = collect($typesToSearch)->map(fn ($searchType) => $this->buildSearchResultSet($searchType, $filters, $perPage));

            return response()->json([
                'success' => true,
                'data' => [
                    ...$resultSets->mapWithKeys(fn ($set) => [$set['key'] => $set['items']])->all(),
                    'search_query' => $filters['search'] ?? '',
                    'filters_applied' => $filters,
                    'pagination' => $resultSets->mapWithKeys(fn ($set) => [$set['key'] => $set['pagination']])->all(),
                ],
            ]);
        });
    }

    /**
     * Determine which entity buckets should be queried for search results.
     */
    private function resolveSearchTypes(?string $type): array
    {
        if ($type && in_array($type, ['treatments', 'clinics', 'machines'], true)) {
            return [$type];
        }

        return ['treatments', 'clinics', 'machines'];
    }

    /**
     * Build a standardized payload (items + pagination) for a given entity type.
     */
    private function buildSearchResultSet(string $type, array $filters, int $perPage): array
    {
        $config = match ($type) {
            'clinics' => [
                'key' => 'clinics',
                'paginator' => $this->clinicRepository->filter($filters, $perPage),
                'resource' => ClinicResource::class,
            ],
            'machines' => [
                'key' => 'machines',
                'paginator' => $this->machineRepository->filter($filters, $perPage),
                'resource' => DetailedMachineResource::class,
            ],
            'treatments' => [
                'key' => 'treatments',
                'paginator' => $this->treatmentRepository->filter($filters, $perPage),
                'resource' => TreatmentResource::class,
            ],
            default => [
                'key' => 'treatments',
                'paginator' => $this->treatmentRepository->filter($filters, $perPage),
                'resource' => TreatmentResource::class,
            ],
        };

        /** @var LengthAwarePaginator $paginator */
        $paginator = $config['paginator'];
        $resourceClass = $config['resource'];

        return [
            'key' => $config['key'],
            'items' => $resourceClass::collection($paginator->items()),
            'pagination' => $this->formatPagination($paginator),
        ];
    }

    /**
     * Normalize pagination metadata structure.
     */
    private function formatPagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Get all filter options for filter screen
     */
    public function getFilters(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $locale = app()->getLocale();
            $isArabic = $locale === 'ar';

            // Get categories
            $categories = $this->categoryRepository->getActiveCategories();
            $categoryOptions = $categories->map(function ($category) use ($isArabic) {
                return [
                    'id' => $category->id,
                    'name' => $isArabic ? ($category->name_ar ?? $category->name_en) : ($category->name_en ?? $category->name_ar),
                ];
            });

            // Get treatments using repository filter method
            // Repository filter already handles approved clinics with active owners
            $treatmentFilters = [
                'status' => 'approved',
            ];
            $treatmentsCollection = $this->treatmentRepository->filter($treatmentFilters, 1000);
            $treatments = $treatmentsCollection->getCollection()
                ->map(function($treatment) {
                    return (object)[
                        'id' => $treatment->id,
                        'name_en' => $treatment->name_en,
                        'name_ar' => $treatment->name_ar,
                    ];
                })
                ->sortBy('name_en')
                ->values();
            
            $treatmentOptions = $treatments->map(function ($treatment) use ($isArabic) {
                return [
                    'id' => $treatment->id,
                    'name' => $isArabic ? ($treatment->name_ar ?? $treatment->name_en) : ($treatment->name_en ?? $treatment->name_ar),
                ];
            });

            // Get machines using repository filter method
            $machineFilters = [
                'status' => 'ready',
            ];
            $machinesCollection = $this->machineRepository->filter($machineFilters, 1000);
            $machines = $machinesCollection->getCollection()
                ->filter(function($machine) {
                    return $machine->clinic 
                        && $machine->clinic->status === 'approved'
                        && $machine->clinic->owner
                        && $machine->clinic->owner->status === 'active';
                })
                ->map(function($machine) {
                    return (object)[
                        'id' => $machine->id,
                        'model_en' => $machine->model_en,
                        'model_ar' => $machine->model_ar,
                    ];
                })
                ->sortBy('model_en')
                ->values();
            
            $machineOptions = $machines->map(function ($machine) use ($isArabic) {
                return [
                    'id' => $machine->id,
                    'name' => $isArabic ? ($machine->model_ar ?? $machine->model_en) : ($machine->model_en ?? $machine->model_ar),
                ];
            });

            // Get price range from treatments using repository
            // Note: Repository filter already handles approved clinics with active owners
            $treatmentFilters = ['status' => 'approved'];
            $allTreatments = $this->treatmentRepository->filter($treatmentFilters, 1000);
            $filteredTreatments = $allTreatments->getCollection()
                ->filter(function($treatment) {
                    return $treatment->clinic 
                        && $treatment->clinic->status === 'approved'
                        && $treatment->clinic->owner
                        && $treatment->clinic->owner->status === 'active';
                });
            
            $priceRange = (object)[
                'min_price' => $filteredTreatments->min('base_price') ?? 0,
                'max_price' => $filteredTreatments->max('base_price') ?? 1000,
            ];

            // Get locations using repository method
            $governorates = $this->governorateRepository->getActiveGovernoratesWithAreas();
            
            $locationOptions = $governorates->map(function ($governorate) use ($isArabic) {
                return [
                    'id' => $governorate->id,
                    'name' => $isArabic ? ($governorate->name_ar ?? $governorate->name_en) : ($governorate->name_en ?? $governorate->name_ar),
                    'type' => 'governorate',
                    'areas' => $governorate->areas->map(function ($area) use ($isArabic) {
                        return [
                            'id' => $area->id,
                            'name' => $isArabic ? ($area->name_ar ?? $area->name_en) : ($area->name_en ?? $area->name_ar),
                            'type' => 'area',
                        ];
                    }),
                ];
            });

            // Static options with translations
            $experienceOptions = [
                ['value' => '1-3', 'label' => __('common.filter_experience_1_3_years')],
                ['value' => '4+', 'label' => __('common.filter_experience_4_years')],
                ['value' => '10+', 'label' => __('common.filter_experience_10_years')],
                ['value' => '15+', 'label' => __('common.filter_experience_15_years')],
            ];

            $starRatingOptions = [
                ['value' => 5, 'label' => '★ 5'],
                ['value' => 4, 'label' => '★ 4'],
                ['value' => 3, 'label' => '★ 3'],
                ['value' => 2, 'label' => '★ 2'],
                ['value' => 1, 'label' => '★ 1'],
            ];

            $sortOptions = [
                ['value' => 'newest', 'label' => __('common.filter_sort_newest')],
                ['value' => 'popularity', 'label' => __('common.filter_sort_most_popular')],
                ['value' => 'price_asc', 'label' => __('common.filter_sort_price_low_to_high')],
                ['value' => 'price_desc', 'label' => __('common.filter_sort_price_high_to_low')],
                ['value' => 'rating', 'label' => __('common.filter_sort_rating')],
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $categoryOptions,
                    'treatments' => $treatmentOptions,
                    'machines' => $machineOptions,
                    'experience' => $experienceOptions,
                    'price_range' => [
                        'min' => (float) ($priceRange->min_price ?? 0),
                        'max' => (float) ($priceRange->max_price ?? 1000),
                    ],
                    'star_ratings' => $starRatingOptions,
                    'locations' => $locationOptions,
                    'sort_options' => $sortOptions,
                ]
            ]);
        });
    }

    /**
     * Map frontend sort options to backend sort keys
     */
    /**
     * Normalize rating filter to array format
     */
    private function normalizeRatingFilter($rating): ?array
    {
        if ($rating === null || $rating === '') {
            return null;
        }
        
        if (is_array($rating)) {
            return array_filter(array_map('intval', $rating), fn($r) => $r >= 1 && $r <= 5);
        }
        
        // Single value - convert to array
        $intRating = (int)$rating;
        if ($intRating >= 1 && $intRating <= 5) {
            return [$intRating];
        }
        
        return null;
    }

    private function mapSortBy(string $sortBy): string
    {
        $mapping = [
            'highest_price' => 'price_desc',
            'lowest_price' => 'price_asc',
            'most_popular' => 'popularity',
            'best_selling' => 'popularity',
        ];

        return $mapping[$sortBy] ?? $sortBy;
    }

    /**
     * Get all categories
     */
    public function categories(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            // Get all active categories
            $categories = $this->categoryRepository->getActiveCategories();

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => CategoryResource::collection($categories),
                ]
            ]);
        });
    }

    /**
     * Get latest treatments for homepage
     */
    public function latestTreatments(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $limit = $request->get('limit', 10);
            
            $treatments = $this->treatmentRepository->getLatestTreatments($limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatments' => TreatmentResource::collection($treatments),
                ]
            ]);
        });
    }

    /**
     * Get locale (already handled by middleware)
     */
    private function getLocale(): string
    {
        $locale = app()->getLocale();
        return in_array($locale, ['ar', 'en']) ? $locale : 'en';
    }

    /**
     * Get privacy policy content based on locale
     */
    public function privacy(Request $request): JsonResponse
    {
        return $this->withTransaction(function () {
            $locale = $this->getLocale();
            
            // Get the appropriate key based on locale
            $key = $locale === 'ar' ? 'privacy_policy_ar' : 'privacy_policy_en';
            
            // Get content from site settings using service
            $content = \App\Services\SiteSettingsService::get($key, '');
            
            // If the requested locale doesn't have content, try the other locale
            if (empty($content)) {
                $fallbackKey = $locale === 'ar' ? 'privacy_policy_en' : 'privacy_policy_ar';
                $content = \App\Services\SiteSettingsService::get($fallbackKey, '');
                // Update locale if we used fallback
                if (!empty($content)) {
                    $locale = $locale === 'ar' ? 'en' : 'ar';
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'locale' => $locale,
                    'content' => $content,
                ]
            ]);
        });
    }

    /**
     * Get terms and conditions content based on locale
     */
    public function terms(Request $request): JsonResponse
    {
        return $this->withTransaction(function () {
            $locale = $this->getLocale();
            
            // Get the appropriate key based on locale
            $key = $locale === 'ar' ? 'terms_conditions_ar' : 'terms_conditions_en';
            
            // Get content from site settings using service
            $content = \App\Services\SiteSettingsService::get($key, '');
            
            // If the requested locale doesn't have content, try the other locale
            if (empty($content)) {
                $fallbackKey = $locale === 'ar' ? 'terms_conditions_en' : 'terms_conditions_ar';
                $content = \App\Services\SiteSettingsService::get($fallbackKey, '');
                // Update locale if we used fallback
                if (!empty($content)) {
                    $locale = $locale === 'ar' ? 'en' : 'ar';
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'locale' => $locale,
                    'content' => $content,
                ]
            ]);
        });
    }
}
