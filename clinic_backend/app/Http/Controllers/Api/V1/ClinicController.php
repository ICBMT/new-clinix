<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Vendor\ToggleFavoriteRequest;
use App\Http\Resources\Api\V1\Home\ClinicResource;
use App\Http\Resources\Api\V1\Clinic\ClinicDetailResource;
use App\Http\Resources\Api\V1\Home\TreatmentResource;
use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\MachineRepositoryInterface;
use App\Contracts\FavoriteRepositoryInterface;
use App\Contracts\ReviewRepositoryInterface;
use App\Http\Resources\Api\V1\Machine\MachineResource;
use App\Http\Resources\Api\V1\Machine\MachineDetailResource;
use App\Http\Resources\Api\V1\Review\ReviewResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function __construct(
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly MachineRepositoryInterface $machineRepository,
        private readonly FavoriteRepositoryInterface $favoriteRepository,
        private readonly \App\Contracts\ReviewRepositoryInterface $reviewRepository
    ) {}

    /**
     * Get clinic details
     * 
     * @param int $id Clinic ID
     * @param Request $request
     */
    public function show(int $id, Request $request, $machineId = null): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request, $machineId) {
            $clinic = $this->clinicRepository->findWithRelations($id);

        if (!$clinic) {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_found'),
            ], 404);
        }

        if ($clinic->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_available'),
            ], 404);
        }

        // Check if clinic owner is active
        if (!$clinic->owner || $clinic->owner->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_available'),
            ], 404);
        }

        // Ensure area relationship is loaded
        if (!$clinic->relationLoaded('area')) {
            $clinic->load('area:id,name_en,name_ar');
        }

        // If machineId is provided, reorder machines to show it first (without duplication)
        if ($machineId && $clinic->relationLoaded('machines')) {
            $machines = $clinic->machines;
            $targetMachine = $machines->firstWhere('id', $machineId);
            
            if ($targetMachine) {
                // Remove the machine from its current position and add it to the beginning
                $machines = $machines->reject(function ($machine) use ($machineId) {
                    return $machine->id == $machineId;
                });
                $machines = $machines->prepend($targetMachine);
                $clinic->setRelation('machines', $machines);
            }
        }

            // Pass request to resource for distance calculation and unreviewed bookings
            return response()->json([
                'success' => true,
                'data' => [
                    'clinic' => new ClinicDetailResource($clinic),
                ]
            ]);
        });
    }

    /**
     * Get clinic treatments
     */
    public function treatments(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $clinic = $this->clinicRepository->findOrFail($id);
        $perPage = $request->get('per_page', 15);

        $treatments = $this->treatmentRepository->getByClinic($clinic->id, $perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatments' => TreatmentResource::collection($treatments->items()),
                    'clinic' => new ClinicResource($clinic),
                    'pagination' => [
                        'current_page' => $treatments->currentPage(),
                        'last_page' => $treatments->lastPage(),
                        'per_page' => $treatments->perPage(),
                        'total' => $treatments->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Toggle clinic favorite status
     */
    public function toggleFavorite(int $id, ToggleFavoriteRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $clinic = $this->clinicRepository->findOrFail($id);

            $isFavorite = $this->favoriteRepository->toggleFavorite($user->id, 'clinic', $id);

            return response()->json([
                'success' => true,
                'message' => $isFavorite ? __('common.clinic_added_to_favorites') : __('common.clinic_removed_from_favorites'),
                'data' => [
                    'is_favorite' => $isFavorite,
                ]
            ]);
        });
    }

    /**
     * Get clinic machines
     */
    public function machines(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $clinic = $this->clinicRepository->findOrFail($id);
        $perPage = $request->get('per_page', 15);

        $machines = $this->machineRepository->getByClinic($clinic->id, $perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'machines' => MachineResource::collection($machines->items()),
                    'clinic' => new ClinicResource($clinic),
                    'pagination' => [
                        'current_page' => $machines->currentPage(),
                        'last_page' => $machines->lastPage(),
                        'per_page' => $machines->perPage(),
                        'total' => $machines->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Get machine details
     */
    public function showMachine(int $id): JsonResponse
    {
        return $this->withTransaction(function () use ($id) {
            $machine = $this->machineRepository->getMachineWithFullDetails($id);

        if (!$machine) {
            return response()->json([
                'success' => false,
                'message' => __('common.machine_not_found'),
            ], 404);
        }

        // Check if clinic is active/approved
        if ($machine->clinic && $machine->clinic->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_available'),
            ], 404);
        }

        // Check if clinic owner is active
        if ($machine->clinic && (!$machine->clinic->owner || $machine->clinic->owner->status !== 'active')) {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_available'),
            ], 404);
        }

            return response()->json([
                'success' => true,
                'data' => [
                    'machine' => new MachineDetailResource($machine),
                ]
            ]);
        });
    }

    /**
     * Get machine treatments
     */
    public function machineTreatments(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $perPage = $request->get('per_page', 15);
        $treatments = $this->machineRepository->getMachineTreatments($id, $perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatments' => TreatmentResource::collection($treatments->items()),
                    'pagination' => [
                        'current_page' => $treatments->currentPage(),
                        'last_page' => $treatments->lastPage(),
                        'per_page' => $treatments->perPage(),
                        'total' => $treatments->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Explore machines with filters
     */
    public function exploreMachines(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $status = 'ready';

            $machines = $this->machineRepository->getByStatus($status);

            return response()->json([
                'success' => true,
                'data' => MachineResource::collection($machines),
            ]);
        });
    }
    /**
     * List all machines with filters
     */
    public function listMachines(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $perPage = $request->get('per_page', 15);
            $status = $request->get('status', 'ready');
            $manufacturer = $request->get('manufacturer');

            $filters = [];
            if ($status) {
                $filters['status'] = $status;
            }
            if ($manufacturer) {
                $filters['manufacturer'] = $manufacturer;
            }
            
            // Location filters
            if ($request->has('location')) {
                $filters['location'] = $request->get('location');
            }
            if ($request->has('area_id')) {
                $filters['area_id'] = $request->get('area_id');
            }
            if ($request->has('governorate_id')) {
                $filters['governorate_id'] = $request->get('governorate_id');
            }
            if ($request->has('latitude') && $request->has('longitude')) {
                $filters['latitude'] = (float)$request->get('latitude');
                $filters['longitude'] = (float)$request->get('longitude');
                $filters['radius'] = (float)$request->get('radius', 10);
            }
            
            // Rating filter
            if ($request->has('rating') || $request->has('star_rating')) {
                $filters['rating'] = $request->get('rating') ?? $request->get('star_rating');
            }
            if ($request->has('ratings')) {
                $filters['ratings'] = is_array($request->get('ratings')) 
                    ? $request->get('ratings') 
                    : explode(',', $request->get('ratings'));
            }
            
            // Price filters
            if ($request->has('min_price')) {
                $filters['min_price'] = (float)$request->get('min_price');
            }
            if ($request->has('max_price')) {
                $filters['max_price'] = (float)$request->get('max_price');
            }

            $machines = $this->machineRepository->filter($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'machines' => MachineResource::collection($machines->items()),
                    'pagination' => [
                        'current_page' => $machines->currentPage(),
                        'last_page' => $machines->lastPage(),
                        'per_page' => $machines->perPage(),
                        'total' => $machines->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Get all clinics that have a specific machine
     * 
     * This endpoint returns all clinics that have the same machine model
     * (e.g., if admin adds a machine and multiple clinics add that machine to their clinic)
     * 
     * Route: GET /api/v1/machines/{id}/clinics
     * 
     * Query Parameters:
     * - location: Filter by location (text search)
     * - latitude: Filter by latitude (requires longitude)
     * - longitude: Filter by longitude (requires latitude)
     * - radius: Search radius in km (default: 10)
     * - rating: Minimum rating (1-5)
     * - star_rating: Alias for rating
     * - sort_by: Sort order (newest, rating, popularity)
     * - per_page: Results per page (default: 15)
     */
    public function machineClinics(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            // Get the machine first to include its info in response
            $machine = $this->machineRepository->find($id);
            
            if (!$machine) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.machine_not_found'),
                ], 404);
            }

            // Build filters from request
            $filters = [
                'location' => $request->get('location'),
                'latitude' => $request->get('latitude'),
                'longitude' => $request->get('longitude'),
                'radius' => $request->get('radius', 10),
                'rating' => $request->get('rating') ?? $request->get('star_rating'),
                'sort_by' => $request->get('sort_by', 'rating'),
            ];

            // Remove null values
            $filters = array_filter($filters, fn($value) => $value !== null && $value !== '');

            $perPage = $request->get('per_page', 15);
            $clinics = $this->machineRepository->getMachineClinics($id, $filters, $perPage);

            $locale = app()->getLocale();
            $isArabic = $locale === 'ar';

            return response()->json([
                'success' => true,
                'data' => [
                    'machine' => [
                        'id' => $machine->id,
                        'model' => $isArabic ? ($machine->model_ar ?? $machine->model_en) : ($machine->model_en ?? $machine->model_ar),
                        'manufacturer' => $isArabic ? ($machine->manufacturer_ar ?? $machine->manufacturer_en) : ($machine->manufacturer_en ?? $machine->manufacturer_ar),
                        'serial_number' => $machine->serial_number,
                        'status' => $machine->status,
                    ],
                    'clinics' => ClinicResource::collection($clinics->items()),
                    'pagination' => [
                        'current_page' => $clinics->currentPage(),
                        'last_page' => $clinics->lastPage(),
                        'per_page' => $clinics->perPage(),
                        'total' => $clinics->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Get share link for clinic
     */
    public function getShareLink(int $id): JsonResponse
    {
        return $this->withTransaction(function () use ($id) {
            $clinic = $this->clinicRepository->findOrFail($id);

            $shareLink = url("/clinics/{$id}");

            $clinicName = $clinic->name_en ?? $clinic->name_ar ?? 'Clinic';
            return response()->json([
                'success' => true,
                'data' => [
                    'share_link' => $shareLink,
                    'clinic_id' => $id,
                    'clinic_name' => $clinicName,
                ]
            ]);
        });
    }

    /**
     * Get user's favorite clinics
     */
    public function favorites(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        $favorites = $this->favoriteRepository->getUserFavorites($user->id, 'clinic', $perPage);

        // Get user's location from default address or request parameters for distance calculation
        $userLatitude = $request->input('latitude');
        $userLongitude = $request->input('longitude');
        
        // If not in request, try to get from user's default address using repository
        if (!$userLatitude || !$userLongitude) {
            $addressRepository = app(\App\Contracts\AddressRepositoryInterface::class);
            $defaultAddress = $addressRepository->getUserAddresses($user->id)
                ->where('is_default', true)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->first();
            
            if (!$defaultAddress) {
                // Try to get any address with coordinates
                $defaultAddress = $addressRepository->getUserAddresses($user->id)
                    ->whereNotNull('latitude')
                    ->whereNotNull('longitude')
                    ->first();
            }
            
            if ($defaultAddress) {
                $userLatitude = $defaultAddress->latitude;
                $userLongitude = $defaultAddress->longitude;
            }
        }
        
        // Merge user location into request for ClinicResource to use
        if ($userLatitude && $userLongitude) {
            $request->merge([
                'latitude' => $userLatitude,
                'longitude' => $userLongitude,
            ]);
        }

        // Extract favoritable (Clinic) models from Favorite models
        $clinics = $favorites->getCollection()->map(function ($favorite) {
            return $favorite->favoritable;
        })->filter(); // Remove null values

            return response()->json([
                'success' => true,
                'data' => [
                    'clinics' => ClinicResource::collection($clinics),
                    'pagination' => [
                        'current_page' => $favorites->currentPage(),
                        'last_page' => $favorites->lastPage(),
                        'per_page' => $favorites->perPage(),
                        'total' => $favorites->total(),
                    ]
                ]
            ]);
        });
    }

    /**
     * Get all active reviews for a clinic with filters
     * 
     * @param int $id Clinic ID
     * @param Request $request
     * @return JsonResponse
     */
    public function reviews(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            // Verify clinic exists
            $clinic = $this->clinicRepository->find($id);
        
        if (!$clinic) {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_found'),
            ], 404);
        }

            $perPage = $request->get('per_page', 15);
            
            // Use clinic relationship to get reviews - using model relationship as ReviewRepository doesn't have specific methods
            // Get approved reviews using clinic relationship
            $query = $clinic->reviews()
                ->where('status', 'approved')
                ->with(['user', 'booking.treatment', 'treatment']);

            // Filter by rating (stars)
            if ($request->has('stars') && $request->get('stars') !== null) {
                $stars = (int) $request->get('stars');
                if ($stars >= 1 && $stars <= 5) {
                    $query->where('rating', $stars);
                }
            }

            // Filter by treatment_id
            if ($request->has('treatment_id') && $request->get('treatment_id') !== null) {
                $treatmentId = (int) $request->get('treatment_id');
                $query->where('treatment_id', $treatmentId);
            }

            // Search filter (searches in comment)
            if ($request->has('search') && $request->get('search') !== null) {
                $search = $request->get('search');
                $query->where('comment', 'LIKE', "%{$search}%");
            }

            // Order by created_at descending (newest first)
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $reviews = $query->paginate($perPage);

            // Calculate summary statistics (before filtering for pagination) - only approved reviews
            $summaryQuery = $clinic->reviews()->where('status', 'approved');

            // Apply same filters for summary
            if ($request->has('treatment_id') && $request->get('treatment_id') !== null) {
                $treatmentId = (int) $request->get('treatment_id');
                $summaryQuery->where('treatment_id', $treatmentId);
            }

            if ($request->has('search') && $request->get('search') !== null) {
                $search = $request->get('search');
                $summaryQuery->where('comment', 'LIKE', "%{$search}%");
            }

            // Calculate average rating and total reviews
            $totalReviews = $summaryQuery->count();
            $averageRating = $totalReviews > 0 
                ? round($summaryQuery->avg('rating'), 2) 
                : 0.0;

            // Calculate rating distribution (count for each star rating 5-1)
            $ratingDistribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            $reviewDistribution = (clone $summaryQuery)
                ->selectRaw('rating, COUNT(*) as count')
                ->groupBy('rating')
                ->get();
            
            foreach ($reviewDistribution as $item) {
                if (isset($ratingDistribution[$item->rating])) {
                    $ratingDistribution[$item->rating] = (int) $item->count;
                }
            }

            return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'average_rating' => (float) $averageRating,
                    'total_reviews' => $totalReviews,
                    'rating_distribution' => [
                        '5' => $ratingDistribution[5],
                        '4' => $ratingDistribution[4],
                        '3' => $ratingDistribution[3],
                        '2' => $ratingDistribution[2],
                        '1' => $ratingDistribution[1],
                    ],
                ],
                'reviews' => ReviewResource::collection($reviews->items()),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'last_page' => $reviews->lastPage(),
                    'per_page' => $reviews->perPage(),
                    'total' => $reviews->total(),
                ]
                ]
            ]);
        });
    }
}
