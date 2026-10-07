<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\CategoryRepositoryInterface;
use App\Contracts\UserRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\MachineRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\TreatmentStoreRequest;
use App\Http\Requests\Dashboard\TreatmentUpdateRequest;
use App\Traits\HandlesRoleBasedQueries;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TreatmentManagementController extends Controller
{
    use HandlesRoleBasedQueries, ScopesClinicData;
    
    /**
     * Check if current user can approve/reject treatments
     * Only super-admin or users with treatments.approve/reject permissions
     */
    private function canApproveRejectTreatments(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !($user instanceof \App\Models\User)) {
            return false;
        }
        
        // Check if user has either approve or reject permission
        return $user->can('treatments.approve') || $user->can('treatments.reject');
    }
    public function __construct(
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly CategoryRepositoryInterface $categoryRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly MachineRepositoryInterface $machineRepository
    ) {}

    /**
     * Display a listing of treatments
     */
    public function index(Request $request): Response
    {
        Gate::authorize('treatments.view');

        $perPage = $request->get('per_page', 15);
        
        // Get treatments with role-based filtering using repository
        $user = $request->user();
        $accessibleClinicIds = $user ? $user->getAccessibleClinicIds() : null;
        
        $treatments = $this->treatmentRepository->getPaginatedWithRoleFilter($request, $perPage, $accessibleClinicIds);

        // Format treatment images - ensure media URLs are properly formatted
        $treatments->getCollection()->transform(function ($treatment) {
            if ($treatment->relationLoaded('media') && $treatment->media->isNotEmpty()) {
                // Transform media to ensure URLs are properly formatted
                $treatment->media->transform(function ($media) {
                    if ($media->file_name) {
                        // If file_name doesn't start with http, convert to full URL
                        if (!str_starts_with($media->file_name, 'http')) {
                            // Remove leading slashes and 'storage/' prefix to avoid duplication
                            $path = ltrim($media->file_name, '/');
                            if (str_starts_with($path, 'storage/')) {
                                $path = substr($path, 8); // Remove 'storage/' prefix
                            }
                            $media->file_name = asset('storage/' . $path);
                        }
                    }
                    return $media;
                });
            }
            return $treatment;
        });

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));
        
        // Check if user can approve/reject treatments (only super-admin or users with permissions)
        $canApproveReject = $this->canApproveRejectTreatments();

        return Inertia::render('dashboard/treatments/index', [
            'treatments' => $treatments,
            'filters' => $filters,
            'canApproveReject' => $canApproveReject,
        ]);
    }

    /**
     * Show the form for creating a new treatment
     */
    public function create(Request $request): Response
    {
        Gate::authorize('treatments.create');

        $categories = $this->categoryRepository->getActiveCategories();
        $user = $request->user();
        
        // Get approved clinics for dropdown based on user role
        $accessibleClinicIds = $user ? $user->getAccessibleClinicIds() : null;
        $clinics = $this->clinicRepository->getApprovedClinicsForDropdown($accessibleClinicIds)
            ->map(fn($clinic) => [
                'id' => $clinic->id,
                'name' => $clinic->name_en ?? $clinic->name_ar,
            ])
            ->toArray();

        // Get all available machines (global + all clinic machines for selection)
        // This will be filtered on the frontend when a clinic is selected
        // For clinic owners/managers, show machines for their clinics + global machines
        $accessibleClinicIds = $user->getAccessibleClinicIds();
        $availableMachines = $this->machineRepository->getAccessibleMachinesForTreatmentCreation($accessibleClinicIds)
            ->map(fn($machine) => [
                'id' => $machine->id,
                'name' => $machine->model_en ?? $machine->model_ar,
                'manufacturer' => $machine->manufacturer_en ?? $machine->manufacturer_ar,
                'clinic_id' => $machine->clinic_id,
                'is_global' => $machine->clinic_id === null,
            ])
            ->toArray();

        return Inertia::render('dashboard/treatments/create', [
            'categories' => $categories->toArray(),
            'clinics' => $clinics,
            'isClinicRole' => $isClinicRole ?? false,
            'availableMachines' => $availableMachines,
        ]);
    }

    /**
     * Store a newly created treatment in storage
     */
    public function store(TreatmentStoreRequest $request)
    {
        Gate::authorize('treatments.create');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            // Convert machine_ids from strings to integers
            if (isset($data['machine_ids']) && is_array($data['machine_ids'])) {
                $data['machine_ids'] = array_map('intval', $data['machine_ids']);
            }
            
            // Auto-calculate final_price from base_price and discount
            $basePrice = isset($data['base_price']) ? (float) $data['base_price'] : 0;
            $hasDiscount = isset($data['has_discount']) && $data['has_discount'];
            $discountType = $data['discount_type'] ?? null;
            $discountValue = isset($data['discount_value']) ? (float) $data['discount_value'] : 0;
            
            if ($hasDiscount && $discountType && $discountValue > 0 && $basePrice > 0) {
                if ($discountType === 'percentage') {
                    $data['final_price'] = round($basePrice * (1 - $discountValue / 100), 2);
                } elseif ($discountType === 'fixed') {
                    $data['final_price'] = round(max(0, $basePrice - $discountValue), 2);
                }
            } else {
                // No discount, final_price equals base_price
                $data['final_price'] = $basePrice;
            }
            
            // Handle image upload
            $image = $request->file('image');
            unset($data['image']);
            
            $treatment = $this->treatmentRepository->create($data);
            
            // Attach image if provided
            if ($image) {
                $mediaService = app(\App\Services\MediaService::class);
                $media = $mediaService->uploadAndCreateMedia($image, 'treatments', [
                    'mediable_type' => \App\Models\Treatment::class,
                    'mediable_id' => $treatment->id,
                    'collection' => 'images',
                ]);
            }
            
            return $treatment;
        });

        return redirect()->route('dashboard.treatments.index')
            ->with('success', __('common.treatment_created_successfully'));
    }

    /**
     * Display the specified treatment
     */
    public function show(int $id): Response
    {
        Gate::authorize('treatments.show');

        $treatment = $this->treatmentRepository->getTreatmentWithFullDetails($id);
        if (!$treatment) {
            abort(404, __('common.treatment_not_found'));
        }

        return Inertia::render('dashboard/treatments/show', [
            'treatment' => $treatment,
        ]);
    }

    /**
     * Show the form for editing the specified treatment
     */
    public function edit(Request $request, int $id): Response
    {
        Gate::authorize('treatments.edit');

        $treatment = $this->treatmentRepository->findOrFail($id);
        // Load all necessary relationships
        $treatment->load([
            'machines:id,model_en,model_ar,manufacturer_en,manufacturer_ar,clinic_id',
            'media' => function ($query) {
                $query->orderBy('id', 'asc')->limit(10);
            }
        ]);
        
        $categories = $this->categoryRepository->getActiveCategories();
        
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        
        // For clinic role: only show their own approved clinics
        // For super admin: show all approved clinics
        $isClinicRole = $user && $user instanceof \App\Models\User && $user->hasRole('clinic') && !$user->hasRole('super-admin');
        
        $accessibleClinicIds = $isClinicRole ? $user->getAccessibleClinicIds() : null;
        $clinics = $this->clinicRepository->getApprovedClinicsForDropdown($accessibleClinicIds);
        
        $clinics = $clinics->map(fn($clinic) => [
            'id' => $clinic->id,
            'name' => $clinic->name_en ?? $clinic->name_ar,
        ])->toArray();
        
        // For clinic role, clinic_id is required (can't create global treatments)
        // $isClinicRole already defined above

        // Get all available machines (global + all clinic machines)
        // If admin creates a machine with a clinic, everyone can use those machines in treatments
        // This will be filtered on the frontend when a clinic is selected
        $user = $request->user();
        $accessibleClinicIds = $user ? $user->getAccessibleClinicIds() : null;
        $availableMachines = $this->machineRepository->getAccessibleMachinesForTreatmentCreation($accessibleClinicIds)
            ->map(fn($machine) => [
                'id' => $machine->id,
                'name' => $machine->model_en ?? $machine->model_ar,
                'manufacturer' => $machine->manufacturer_en ?? $machine->manufacturer_ar,
                'clinic_id' => $machine->clinic_id,
                'is_global' => $machine->clinic_id === null,
            ])
            ->toArray();

        // Prepare treatment data with machines and media
        $treatmentData = $treatment->toArray();
        $treatmentData['machines'] = $treatment->machines->map(fn($machine) => [
            'id' => $machine->id,
        ])->toArray();
        // Ensure media is included
        if (!isset($treatmentData['media'])) {
            $treatmentData['media'] = $treatment->media->map(fn($media) => [
                'id' => $media->id,
                'file_name' => $media->file_name,
                'url' => $media->url ?? $media->file_name,
            ])->toArray();
        }
        
        // Ensure all treatment fields are properly set with defaults for form initialization
        $treatmentData['description_en'] = $treatmentData['description_en'] ?? '';
        $treatmentData['description_ar'] = $treatmentData['description_ar'] ?? '';
        $treatmentData['discount_type'] = $treatmentData['discount_type'] ?? 'percentage';
        $treatmentData['discount_value'] = $treatmentData['discount_value'] ?? '';
        $treatmentData['has_discount'] = $treatmentData['has_discount'] ?? false;
        $treatmentData['service_duration_minutes'] = $treatmentData['service_duration_minutes'] ?? '';
        $treatmentData['sessions_required'] = $treatmentData['sessions_required'] ?? 1;
        $treatmentData['final_price'] = $treatmentData['final_price'] ?? $treatmentData['base_price'] ?? '';

        return Inertia::render('dashboard/treatments/edit', [
            'treatment' => $treatmentData,
            'categories' => $categories->toArray(),
            'clinics' => $clinics,
            'availableMachines' => $availableMachines,
            'isClinicRole' => $isClinicRole ?? false,
        ]);
    }

    /**
     * Update the specified treatment in storage
     */
    public function update(TreatmentUpdateRequest $request, int $id)
    {
        Gate::authorize('treatments.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();
            
            // Auto-calculate final_price from base_price and discount
            $basePrice = isset($data['base_price']) ? (float) $data['base_price'] : 0;
            $hasDiscount = isset($data['has_discount']) && $data['has_discount'];
            $discountType = $data['discount_type'] ?? null;
            $discountValue = isset($data['discount_value']) ? (float) $data['discount_value'] : 0;
            
            if ($hasDiscount && $discountType && $discountValue > 0 && $basePrice > 0) {
                if ($discountType === 'percentage') {
                    $data['final_price'] = round($basePrice * (1 - $discountValue / 100), 2);
                } elseif ($discountType === 'fixed') {
                    $data['final_price'] = round(max(0, $basePrice - $discountValue), 2);
                }
            } else {
                // No discount, final_price equals base_price
                $data['final_price'] = $basePrice;
            }
            
            // Convert machine_ids from strings to integers
            if (isset($data['machine_ids']) && is_array($data['machine_ids'])) {
                $data['machine_ids'] = array_map('intval', $data['machine_ids']);
            }
            
            // Handle image upload
            $image = $request->file('image');
            unset($data['image']);
            
            $treatment = $this->treatmentRepository->update($id, $data);
            
            // Attach image if provided
            if ($image) {
                // Delete old images
                $treatment->media()->where('collection_name', 'images')->delete();
                
                $mediaService = app(\App\Services\MediaService::class);
                $media = $mediaService->uploadAndCreateMedia($image, 'treatments', [
                    'mediable_type' => \App\Models\Treatment::class,
                    'mediable_id' => $treatment->id,
                    'collection' => 'images',
                ]);
                
                // Note: Treatment model doesn't have an 'image' field, so URL is stored in media relationship's file_name
                // The media->file_name already contains the full URL from MediaService
            }
            
            return $treatment;
        });

        return redirect()->route('dashboard.treatments.edit', $id)
            ->with('success', __('common.treatment_updated_successfully'));
    }

    /**
     * Remove the specified treatment from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('treatments.destroy');

        $this->withTransaction(function () use ($request, $id) {
            $this->treatmentRepository->delete($id);
        });

        return redirect()->route('dashboard.treatments.index')
            ->with('success', __('common.treatment_deleted_successfully'));
    }

    /**
     * Toggle status
     */
    public function toggleStatus(Request $request, int $id)
    {
        $status = $request->input('status');
        
        // Check appropriate permission based on status
        if ($status === 'approved') {
            Gate::authorize('treatments.approve');
        } elseif ($status === 'rejected') {
            Gate::authorize('treatments.reject');
        } else {
            // For pending or other statuses, check toggle-status permission
            Gate::authorize('treatments.toggle-status');
        }

        $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->treatmentRepository->update($id, [
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.treatment_updated_successfully'));
    }

    /**
     * Toggle featured
     */
    public function toggleFeatured(Request $request, int $id)
    {
        Gate::authorize('treatments.toggle-featured');

        $request->validate([
            'is_featured' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->treatmentRepository->update($id, [
                'is_featured' => $request->input('is_featured'),
            ]);
        });

        return back()->with('success', __('common.treatment_updated_successfully'));
    }

    /**
     * Toggle fast booking
     */
    public function toggleFastBooking(Request $request, int $id)
    {
        Gate::authorize('treatments.toggle-fast-booking');

        $request->validate([
            'is_fast_booking' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->treatmentRepository->update($id, [
                'is_fast_booking' => $request->input('is_fast_booking'),
            ]);
        });

        return back()->with('success', __('common.treatment_updated_successfully'));
    }
}

