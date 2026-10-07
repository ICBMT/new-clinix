<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Service\ToggleFavoriteRequest;
use App\Http\Requests\Api\V1\Treatment\GetAvailableMachinesRequest;
use App\Http\Resources\Api\V1\Home\TreatmentResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentDetailResource;
use App\Http\Resources\Api\V1\Machine\MachineResource;
use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\CategoryRepositoryInterface;
use App\Contracts\FavoriteRepositoryInterface;
use App\Contracts\MachineRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TreatmentController extends Controller
{
    public function __construct(
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly FavoriteRepositoryInterface $favoriteRepository,
        private readonly CategoryRepositoryInterface $categoryRepository,
        private readonly MachineRepositoryInterface $machineRepository
    ) {}

    /**
     * Get list of treatments with filters
     */
    public function index(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $perPage = (int) $request->get('per_page', 15);
            $isFastBooking = $request->boolean('is_fast_booking', false);
            
            $filters = [];
            
            if ($isFastBooking) {
                $filters['is_fast_booking'] = true;
            }
            
            if ($request->has('category_id')) {
                $filters['category_id'] = (int) $request->get('category_id');
            }
            
            if ($request->has('vendor_id')) {
                $filters['vendor_id'] = (int) $request->get('vendor_id');
            }
            
            if ($request->has('is_featured')) {
                $filters['is_featured'] = $request->boolean('is_featured');
            }
            
            if ($request->has('status')) {
                $filters['status'] = $request->get('status');
            } else {
                $filters['status'] = 'approved';
            }
            
            $treatments = $this->treatmentRepository->filter($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatments' => \App\Http\Resources\Api\V1\Home\TreatmentResource::collection($treatments->items()),
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
     * Get user's favorites (treatments, clinics, or machines)
     * Supports type parameter: ?type=treatment|clinic|machine (default: treatment)
     */
    public function favorites(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $type = $request->get('type', 'treatment'); // Default to treatment for backward compatibility
        
        // Validate type
        if (!in_array($type, ['treatment', 'clinic', 'machine'])) {
            return response()->json([
                'success' => false,
                'message' => __('common.invalid_favorite_type'),
            ], 400);
        }
        
        $favorites = $this->favoriteRepository->getUserFavorites($user->id, $type, $perPage);

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

        // Return appropriate resource based on type
        // Extract favoritable models from Favorite models
        if ($type === 'clinic') {
            $clinics = $favorites->getCollection()->map(function ($favorite) {
                return $favorite->favoritable;
            })->filter(); // Remove null values
            
            return response()->json([
                'success' => true,
                'data' => [
                    'favorites' => \App\Http\Resources\Api\V1\Home\ClinicResource::collection($clinics),
                    'pagination' => [
                        'current_page' => $favorites->currentPage(),
                        'last_page' => $favorites->lastPage(),
                        'per_page' => $favorites->perPage(),
                        'total' => $favorites->total(),
                    ]
                ]
            ]);
        } elseif ($type === 'machine') {
            $machines = $favorites->getCollection()->map(function ($favorite) {
                return $favorite->favoritable;
            })->filter(); // Remove null values
            
            return response()->json([
                'success' => true,
                'data' => [
                    'favorites' => \App\Http\Resources\Api\V1\Machine\MachineResource::collection($machines),
                    'pagination' => [
                        'current_page' => $favorites->currentPage(),
                        'last_page' => $favorites->lastPage(),
                        'per_page' => $favorites->perPage(),
                        'total' => $favorites->total(),
                    ]
                ]
            ]);
        } else {
            // Default: treatments
            $treatments = $favorites->getCollection()->map(function ($favorite) {
                return $favorite->favoritable;
            })->filter(); // Remove null values
            
            return response()->json([
                'success' => true,
                'data' => [
                    'favorites' => \App\Http\Resources\Api\V1\Home\TreatmentResource::collection($treatments),
                    'pagination' => [
                        'current_page' => $favorites->currentPage(),
                        'last_page' => $favorites->lastPage(),
                        'per_page' => $favorites->perPage(),
                        'total' => $favorites->total(),
                    ]
                    ]
                ]);
            }
        });
    }

    /**
     * Quick search endpoint used on home
     */
    public function search(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $query = (string) $request->get('q', $request->get('query', ''));
        $categoryId = $request->get('category_id');
        $latitude = $request->get('lat');
        $longitude = $request->get('lng');

        $results = $this->treatmentRepository->search($query, $categoryId, $latitude, $longitude);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatments' => \App\Http\Resources\Api\V1\Home\TreatmentResource::collection($results),
                ]
            ]);
        });
    }

    /**
     * Get service details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        return $this->withTransaction(function () use ($request, $id) {
            $date = $request->get('date'); // Optional date parameter
        
        $treatment = $this->treatmentRepository->getTreatmentWithFullDetails($id, $date);

        if (!$treatment || $treatment->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => __('common.treatment_not_available'),
            ], 404);
        }

        // Check if clinic is active/approved - restrict access if clinic is inactive
        if ($treatment->clinic && $treatment->clinic->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_available'),
            ], 403);
        }

        // Check if clinic owner is active
        if ($treatment->clinic && (!$treatment->clinic->owner || $treatment->clinic->owner->status !== 'active')) {
            return response()->json([
                'success' => false,
                'message' => __('common.clinic_not_available'),
            ], 404);
        }

        // Get packages that include this treatment
        $packages = $this->treatmentRepository->getPackagesByTreatmentId($id, 10);

        // Get other treatments by clinic (excluding current treatment)
        $otherTreatments = $this->treatmentRepository->getByClinic($treatment->clinic_id, 6);
        // Filter out current treatment from the collection
        $filteredItems = $otherTreatments->getCollection()->filter(function ($item) use ($id) {
            return $item->id !== $id;
        });
        $otherTreatments->setCollection($filteredItems);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatment' => new TreatmentDetailResource($treatment),
                    'packages' => $this->formatPackages($packages),
                    'other_treatments_by_clinic' => TreatmentResource::collection($otherTreatments->items()),
                ]
            ]);
        });
    }

    /**
     * Format service packages for API response
     */
    private function formatPackages($packages): array
    {
        $locale = app()->getLocale();
        $isArabic = $locale === 'ar';

        return $packages->map(function ($package) use ($isArabic) {
            // Generate label based on package name
            $nameEn = strtolower($package->name_en ?? '');
            $label = '';
            if (strpos($nameEn, 'silver') !== false) {
                $label = 'SP'; // Silver Package
            } elseif (strpos($nameEn, 'golden') !== false || strpos($nameEn, 'gold') !== false) {
                $label = 'GP'; // Golden Package
            } elseif (strpos($nameEn, 'premium') !== false) {
                $label = 'PP'; // Premium Package
            } else {
                // Generate label from first letters of words
                $words = explode(' ', $nameEn);
                $label = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));
            }
            
            return [
                'id' => $package->id,
                'name' => $isArabic ? $package->name_ar : $package->name_en,
                'description' => $isArabic ? $package->description_ar : $package->description_en,
                'label' => $label,
                'total_price' => $package->total_price,
                'discount_amount' => $package->discount_amount,
                'final_price' => $package->final_price,
                'currency' => $package->currency,
                'status' => $package->status,
                'special_instructions' => $package->special_instructions,
                'created_at' => $package->created_at,
                'updated_at' => $package->updated_at,
            ];
        })->toArray();
    }

    /**
     * Toggle service favorite status
     */
    public function toggleFavorite(int $id, ToggleFavoriteRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $treatment = $this->treatmentRepository->findOrFail($id);

            $isFavorite = $this->favoriteRepository->toggleFavorite($user->id, 'treatment', $id);

            return response()->json([
                'success' => true,
                'message' => $isFavorite ? __('common.treatment_added_to_favorites') : __('common.treatment_removed_from_favorites'),
                'data' => [
                    'is_favorite' => $isFavorite,
                ]
            ]);
        });
    }

    /**
     * Check availability for treatments (per SRS Section 4.1.7)
     * Supports filtering by machine
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $treatmentId = (int) ($request->get('treatment_id') ?? $request->get('service_id'));
        $date = $request->get('date', now()->format('Y-m-d'));
        $machineIds = $request->get('machine_ids'); // Array of machine IDs

        if (!$treatmentId) {
            return response()->json([
                'success' => false,
                'message' => __('common.treatment_id_required'),
                'errors' => ['treatment_id' => [__('common.treatment_id_required')]]
            ], 422);
        }

        // Convert to arrays if provided as comma-separated strings
        if (is_string($machineIds)) {
            $machineIds = array_filter(array_map('intval', explode(',', $machineIds)));
        }

        $availability = $this->treatmentRepository->getAvailability(
            $treatmentId, 
            $date, 
            $machineIds ?: null
        );

            return response()->json([
                'success' => true,
                'data' => [
                    'availability' => $availability,
                    'date' => $date,
                ]
            ]);
        });
    }

    /**
     * Get active categories
     */
    public function categories(): JsonResponse
    {
        return $this->withTransaction(function () {
            $categories = $this->categoryRepository->getActiveCategories();

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $categories,
                ]
            ]);
        });
    }

    /**
     * Get share link for treatment
     */
    public function getShareLink(int $id): JsonResponse
    {
        return $this->withTransaction(function () use ($id) {
            $treatment = $this->treatmentRepository->findOrFail($id);
            
            $shareLink = url("/treatments/{$id}");

            return response()->json([
                'success' => true,
                'data' => [
                    'share_link' => $shareLink,
                    'treatment_id' => $id,
                    'treatment_name' => $treatment->name_en ?? $treatment->name_ar,
                ]
            ]);
        });
    }

    /**
     * Get available machines for a treatment on a specific date
     */
    public function getAvailableMachines(GetAvailableMachinesRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            $treatmentId = $data['treatment_id'];
            $date = $data['date'];

            // Verify treatment exists and is approved
            $treatment = $this->treatmentRepository->find($treatmentId);
            
            if (!$treatment || $treatment->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => __('common.treatment_not_available'),
                ], 404);
            }

            // Get available machines
            $machines = $this->machineRepository->getAvailableMachinesForTreatment($treatmentId, $date);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatment_id' => $treatmentId,
                    'date' => $date,
                    'machines' => MachineResource::collection($machines),
                    'count' => $machines->count(),
                ]
            ]);
        });
    }
}
