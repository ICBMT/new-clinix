<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\MachineRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\MachineStoreRequest;
use App\Http\Requests\Dashboard\MachineUpdateRequest;
use App\Traits\HandlesRoleBasedQueries;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MachineManagementController extends Controller
{
    use HandlesRoleBasedQueries, ScopesClinicData;
    public function __construct(
        private readonly MachineRepositoryInterface $machineRepository,
        private readonly ClinicRepositoryInterface $clinicRepository
    ) {}

    /**
     * Display a listing of machines
     */
    public function index(Request $request): Response
    {
        Gate::authorize('machines.view');

        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        // Get filters from request
        $filters = array_merge(
            $request->only(['search', 'status', 'clinic_id', 'treatment_id']),
            $request->get('filters', [])
        );

        // Use role-based filtering
        $machines = $this->machineRepository->getMachinesForUser($user, $filters, $perPage);

        // Format machine images - get image from media relationship or fallback to image field
        $machines->getCollection()->transform(function ($machine) {
            // Get image URL - prioritize media collection, fallback to image field
            $imageUrl = null;
            
            // First, try to get from media collection (using relationship directly)
            if ($machine->relationLoaded('media') && $machine->media->isNotEmpty()) {
                // Find image in 'images' collection first
                $imageMedia = $machine->media
                    ->where('collection_name', 'images')
                    ->sortByDesc('created_at')
                    ->first();
                
                if (!$imageMedia) {
                    // If no image in 'images' collection, use first media item
                    $imageMedia = $machine->media->first();
                }
                
                if ($imageMedia && $imageMedia->file_name) {
                    $imageUrl = $imageMedia->file_name;
                }
            }
            
            // Fallback to image field in database
            if (!$imageUrl && $machine->image) {
                $imageUrl = $machine->image;
            }
            
            // Convert to full URL using model's static method
            if ($imageUrl) {
                $machine->setAttribute('image', \App\Models\Machine::getStorageUrl($imageUrl));
            } else {
                $machine->setAttribute('image', null);
            }
            
            return $machine;
        });

        // Get accessible clinics for filter dropdown
        $accessibleClinics = $this->getAccessibleClinics($user);
        
        // Get accessible treatments for filter dropdown
        $accessibleTreatments = $this->getAccessibleTreatments($user);
        
        // Check if user can approve/reject machines (only super-admin or users with permissions)
        $canApproveReject = $this->canApproveRejectMachines();

        return Inertia::render('dashboard/machines/index', [
            'machines' => $machines,
            'filters' => $filters,
            'accessibleClinics' => $accessibleClinics,
            'accessibleTreatments' => $accessibleTreatments,
            'canApproveReject' => $canApproveReject,
        ]);
    }

    /**
     * Get clinics accessible to the user based on their role
     * Only returns approved clinics
     */
    private function getAccessibleClinics($user)
    {
        return $this->getApprovedClinicsForDropdown()
            ->map(function ($clinic) {
                return [
                    'id' => $clinic->id,
                    'name_en' => $clinic->name_en ?? '',
                    'name_ar' => $clinic->name_ar ?? '',
                ];
            });
    }

    /**
     * Get treatments accessible to the user based on their role
     * Returns approved treatments from accessible clinics
     */
    private function getAccessibleTreatments($user)
    {
        $accessibleClinicIds = $user->getAccessibleClinicIds();
        
        $query = \App\Models\Treatment::where('status', 'approved')
            ->select('id', 'name_en', 'name_ar', 'clinic_id')
            ->orderBy('name_en');
        
        if (!empty($accessibleClinicIds)) {
            $approvedClinicIds = \App\Models\Clinic::whereIn('id', $accessibleClinicIds)
                ->where('status', 'approved')
                ->pluck('id')
                ->toArray();
            
            $query->where(function($q) use ($approvedClinicIds) {
                $q->whereNull('clinic_id') // Global treatments
                  ->orWhereIn('clinic_id', $approvedClinicIds); // Treatments from accessible clinics
            });
        }
        
        return $query->get()
            ->map(function ($treatment) {
                return [
                    'id' => $treatment->id,
                    'name_en' => $treatment->name_en ?? '',
                    'name_ar' => $treatment->name_ar ?? '',
                ];
            });
    }

    /**
     * Show the form for creating a new machine
     */
    public function create(): Response
    {
        Gate::authorize('machines.create');

        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        
        // For clinic role: only show their own approved clinics (required, can't create global)
        // For super admin: show all approved clinics (can create global machines)
        if ($user && $user->hasRole('clinic') && !$user->hasRole('super-admin')) {
            // Clinic role: only their own clinics
            $clinics = $this->getApprovedClinicsForDropdown();
        } else {
            // Super admin: all approved clinics
            $clinics = $this->clinicRepository->findBy(['status' => 'approved'], 1000);
        }
        
        // Ensure we have a collection and convert to array format
        if (!$clinics instanceof \Illuminate\Support\Collection) {
            $clinics = collect($clinics);
        }
        
        $clinics = $clinics->map(function ($clinic) {
            return [
                'id' => $clinic->id,
                'name_en' => $clinic->name_en ?? '',
                'name_ar' => $clinic->name_ar ?? '',
            ];
        })->values()->toArray();
        
        // For clinic role, clinic_id is required (can't create global machines)
        $isClinicRole = $user && $user->hasRole('clinic') && !$user->hasRole('super-admin');

        // Get active categories
        $categories = \App\Models\Category::select('id', 'name_en', 'name_ar')
            ->where('status', 'active')
            ->orderBy('name_en')
            ->get()
            ->map(fn($category) => [
                'id' => $category->id,
                'name_en' => $category->name_en,
                'name_ar' => $category->name_ar,
            ])
            ->toArray();

        return Inertia::render('dashboard/machines/create', [
            'clinics' => $clinics,
            'categories' => $categories,
            'isClinicRole' => $isClinicRole ?? false,
        ]);
    }

    /**
     * Store a newly created machine in storage
     */
    public function store(MachineStoreRequest $request)
    {
        Gate::authorize('machines.create');

        $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            // Handle category_ids separately
            $categoryIds = $request->input('category_ids', []);
            if (is_string($categoryIds)) {
                $categoryIds = json_decode($categoryIds, true) ?? [];
            }
            if (!is_array($categoryIds)) {
                $categoryIds = [];
            }
            unset($data['category_ids']);

            // Handle image upload
            $image = $request->file('image');
            unset($data['image']);
            
            $machine = $this->machineRepository->create($data);
            
            // Sync categories (many-to-many)
            if (!empty($categoryIds)) {
                $machine->categories()->sync($categoryIds);
            }
            
            // Attach image if provided using MediaService
            if ($image) {
                $mediaService = app(\App\Services\MediaService::class);
                $mediaService->uploadAndCreateMedia($image, 'machines', [
                    'mediable_type' => \App\Models\Machine::class,
                    'mediable_id' => $machine->id,
                    'collection' => 'images',
                ]);
            }
            
            return $machine;
        });

        return redirect()->route('dashboard.machines.index')
            ->with('success', __('common.machine_created_successfully'));
    }

    /**
     * Display the specified machine
     */
    public function show(int $id): Response
    {
        Gate::authorize('machines.show');

        $machine = $this->machineRepository->findOrFail($id);
        $machine->load([
            'clinic' => function($query) {
                $query->with([
                    'area:id,name_en,name_ar',
                    'governorate:id,name_en,name_ar',
                    'operatingHours'
                ]);
            },
            'category:id,name_en,name_ar',
            'media' => function($query) {
                $query->where('collection_name', 'images')->orderBy('created_at', 'desc');
            },
        ]);

        // Format machine data
        $machineData = $machine->toArray();
        
        // Get image URL - prioritize media collection, fallback to image field
        $imageUrl = null;
        
        // First, try to get from media collection
        if (isset($machineData['media']) && count($machineData['media']) > 0) {
            $firstImage = $machineData['media'][0];
            $imageUrl = $firstImage['file_name'] ?? $firstImage['url'] ?? null;
        }
        
        // Fallback to image field in database
        if (!$imageUrl && isset($machineData['image'])) {
            $imageUrl = $machineData['image'];
        }
        
        // Convert to full URL using model's static method
        if ($imageUrl) {
            $machineData['image'] = \App\Models\Machine::getStorageUrl($imageUrl);
        }

        return Inertia::render('dashboard/machines/show', [
            'machine' => $machineData,
        ]);
    }

    /**
     * Show the form for editing the specified machine
     */
    public function edit(int $id): Response
    {
        Gate::authorize('machines.edit');

        $machine = $this->machineRepository->findOrFail($id);
        $machine->load(['category:id,name_en,name_ar', 'categories:id,name_en,name_ar', 'clinic:id,name_en,name_ar']);

        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        
        // For clinic role: only show their own approved clinics
        // For super admin: show all approved clinics
        if ($user && $user->hasRole('clinic') && !$user->hasRole('super-admin')) {
            // Clinic role: only their own clinics
            $clinics = $this->getApprovedClinicsForDropdown();
        } else {
            // Super admin: all approved clinics
            $clinics = $this->clinicRepository->findBy(['status' => 'approved'], 1000);
        }
        
        $clinics = $clinics->map(function ($clinic) {
            return [
                'id' => $clinic->id,
                'name_en' => $clinic->name_en ?? '',
                'name_ar' => $clinic->name_ar ?? '',
            ];
        });
        
        // For clinic role, clinic_id is required (can't create global machines)
        $isClinicRole = $user && $user->hasRole('clinic') && !$user->hasRole('super-admin');

        // Get active categories
        $categories = \App\Models\Category::select('id', 'name_en', 'name_ar')
            ->where('status', 'active')
            ->orderBy('name_en')
            ->get()
            ->map(fn($category) => [
                'id' => $category->id,
                'name_en' => $category->name_en,
                'name_ar' => $category->name_ar,
            ])
            ->toArray();

        // Prepare machine data with relationships
        $machineData = $machine->toArray();
        $machineData['clinic'] = $machine->clinic ? [
            'id' => $machine->clinic->id,
            'name_en' => $machine->clinic->name_en,
            'name_ar' => $machine->clinic->name_ar,
        ] : null;
        $machineData['category'] = $machine->category ? [
            'id' => $machine->category->id,
            'name_en' => $machine->category->name_en,
            'name_ar' => $machine->category->name_ar,
        ] : null;
        // Add categories array for multi-select
        $machineData['categories'] = $machine->categories->map(function ($category) {
            return [
                'id' => $category->id,
                'name_en' => $category->name_en,
                'name_ar' => $category->name_ar,
            ];
        })->toArray();

        return Inertia::render('dashboard/machines/edit', [
            'machine' => $machineData,
            'clinics' => $clinics,
            'categories' => $categories,
            'isClinicRole' => $isClinicRole ?? false,
        ]);
    }

    /**
     * Update the specified machine in storage
     */
    public function update(MachineUpdateRequest $request, int $id)
    {
        Gate::authorize('machines.edit');

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->validated();

            // Handle category_ids separately
            $categoryIds = $request->input('category_ids', []);
            if (is_string($categoryIds)) {
                $categoryIds = json_decode($categoryIds, true) ?? [];
            }
            if (!is_array($categoryIds)) {
                $categoryIds = [];
            }
            unset($data['category_ids']);

            // Convert empty strings to null for nullable fields
            if (isset($data['clinic_id']) && $data['clinic_id'] === '') {
                $data['clinic_id'] = null;
            }
            if (isset($data['category_id']) && $data['category_id'] === '') {
                $data['category_id'] = null;
            }

            // Handle image upload
            $image = $request->file('image');
            unset($data['image']);
            
            $machine = $this->machineRepository->update($id, $data);
            
            // Sync categories (many-to-many)
            $machine->categories()->sync($categoryIds);
            
            // Attach image if provided
            if ($image) {
                // Delete old images
                $machine->media()->where('collection_name', 'images')->delete();
                
                $mediaService = app(\App\Services\MediaService::class);
                $media = $mediaService->uploadAndCreateMedia($image, 'machines', [
                    'mediable_type' => \App\Models\Machine::class,
                    'mediable_id' => $machine->id,
                    'collection' => 'images',
                ]);
                
                // Store the full URL in the image field
                if ($media && $media->file_name) {
                    $data['image'] = $media->file_name;
                    $machine->update(['image' => $media->file_name]);
                }
            }
            
            return $machine;
        });

        return redirect()->route('dashboard.machines.edit', $id)
            ->with('success', __('common.machine_updated_successfully'));
    }

    /**
     * Remove the specified machine from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('machines.destroy');

        $this->withTransaction(function () use ($request, $id) {
            $this->machineRepository->findOrFail($id);

            $this->machineRepository->delete($id);
        });

        return redirect()->route('dashboard.machines.index')
            ->with('success', __('common.machine_deleted_successfully'));
    }

    /**
     * Toggle machine status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('machines.toggle-status');

        $request->validate([
            'status' => ['required', 'in:ready,maintenance,busy'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->machineRepository->update($id, [
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.machine_updated_successfully'));
    }

    /**
     * Check if current user can approve/reject machines
     * Only super-admin or users with machines.approve/reject permissions
     */
    private function canApproveRejectMachines(): bool
    {
        /** @var \App\Models\User|null $user */
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !($user instanceof \App\Models\User)) {
            return false;
        }
        
        // Check if user has either approve or reject permission
        return $user->can('machines.approve') || $user->can('machines.reject');
    }

    /**
     * Approve machine request
     */
    public function approve(Request $request, int $id)
    {
        Gate::authorize('machines.approve');

        $this->withTransaction(function () use ($id) {
            $this->machineRepository->update($id, [
                'request_status' => 'approved',
                'rejection_reason' => null,
            ]);
        });

        return back()->with('success', __('common.machine_approved_successfully'));
    }

    /**
     * Reject machine request
     */
    public function reject(Request $request, int $id)
    {
        Gate::authorize('machines.reject');

        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $this->machineRepository->update($id, [
                'request_status' => 'rejected',
                'rejection_reason' => $request->input('rejection_reason'),
            ]);
        });

        return back()->with('success', __('common.machine_rejected_successfully'));
    }
}

