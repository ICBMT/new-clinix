<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Rules\KuwaitPhone;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Http\Requests\Dashboard\StaffStoreRequest;
use App\Http\Requests\Dashboard\StaffUpdateRequest;
use Inertia\Inertia;
use Inertia\Response;

class ClinicStaffManagementController extends Controller
{
    use ScopesClinicData;
    public function __construct(
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly UserRepositoryInterface $userRepository
    ) {}

    /**
     * Show the form for creating a new staff member
     */
    public function create(): Response
    {
        Gate::authorize('clinics-staff.create');

        // Get approved clinic owners for dropdown (only approved clinics)
        $owners = $this->getApprovedClinicOwnersForDropdown();

        return Inertia::render('dashboard/clinics-staff/create', [
            'users' => $owners,
        ]);
    }

    /**
     * Get clinics for a specific owner
     */
    public function getClinicsByOwner(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!Gate::any(['clinics-staff.create', 'clinics-staff.edit'])) {
            abort(403, __('common.unauthorized'));
        }

        $request->validate([
            'owner_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $owner = \App\Models\User::findOrFail($request->owner_id);

        // Get clinics owned by this user (via owner_id relationship)
        // Use the ownedClinics relationship from User model
        $clinics = $owner->ownedClinics()
            ->where('status', 'approved')
            ->select('id', 'name_en', 'name_ar', 'email', 'phone', 'status', 'address', 'category_id')
            ->orderBy('name_en')
            ->get();

        return response()->json($clinics);
    }

    /**
     * Store a newly created staff member
     */
    public function store(StaffStoreRequest $request)
    {
        $validated = $request->validated();

        // Convert clinic_ids to integers
        $clinicIds = array_map('intval', $validated['clinic_ids']);

        // Verify that all clinics belong to the selected owner
        $ownerClinics = \App\Models\Clinic::where('owner_id', $validated['owner_id'])
            ->pluck('id')
            ->toArray();
        
        $invalidClinics = array_diff($clinicIds, $ownerClinics);
        if (!empty($invalidClinics)) {
            return back()->withErrors([
                'clinic_ids' => __('common.clinic_ids_must_belong_to_owner')
            ])->withInput();
        }

        $staff = $this->userRepository->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'], // Password will be automatically hashed by UserRepository
            'status' => $validated['status'],
        ]);

        // Attach clinics
        $staff->clinics()->attach($clinicIds);

        // Automatically assign clinic_manager role
        $clinicManagerRole = \Spatie\Permission\Models\Role::where('name', 'clinic_manager')->first();
        if ($clinicManagerRole) {
            $staff->assignRole($clinicManagerRole);
        }

        return redirect()->route('dashboard.clinics-staff.index')
            ->with('success', __('common.staff_created_successfully'));
    }

    /**
     * Display a listing of all clinic staff
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics-staff.view');

        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        // Get filters from request (can be in filters array or top level)
        $requestFilters = $request->get('filters', []);
        $filters = [
            'clinic_id' => $requestFilters['clinic_id'] ?? $request->get('clinic_id'),
            'role' => $requestFilters['role'] ?? $request->get('role'),
            'status' => $requestFilters['status'] ?? $request->get('status'),
            'search' => $request->get('search'),
        ];

        // Get filters from request
        $ownerId = $requestFilters['owner_id'] ?? $request->get('owner_id');
        $staffType = $requestFilters['staff_type'] ?? $request->get('staff_type', 'clinic_manager'); // Default to 'clinic_manager'
        
        // Build query based on user role
        if ($user->hasRole('super_admin')) {
            // Super admin: Show all clinic manager role users
            if ($staffType === 'clinic') {
                $query = \App\Models\User::role('clinic')
                    ->with([
                        'clinics' => function($q) {
                            $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                        'roles:id,name,alias',
                        'ownedClinics' => function($q) {
                            $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                    ]);
            } elseif ($staffType === 'clinic_manager') {
                $query = \App\Models\User::role('clinic_manager')
                    ->with([
                        'clinics' => function($q) {
                            $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                        'roles:id,name,alias',
                    ]);
            } else {
                $query = \App\Models\User::whereHas('clinics', function($q) {
                    $q->whereNotNull('clinic_users.clinic_id');
                })
                ->with([
                    'clinics' => function($q) {
                        $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                    },
                    'roles:id,name',
                ]);
            }
        } elseif ($user->hasRole('clinic_manager')) {
            // Clinic manager: Show clinic staff for clinics they manage
            $managerClinicIds = $user->clinics()->pluck('clinics.id')->toArray();
            
            if (empty($managerClinicIds)) {
                // If manager has no clinics, return empty result
                $query = \App\Models\User::whereRaw('1 = 0');
            } else {
                // Filter by staff_type to show either 'clinic' or 'clinic_manager' role users
                if ($staffType === 'clinic') {
                    $query = \App\Models\User::role('clinic')
                        ->whereHas('clinics', function($q) use ($managerClinicIds) {
                            $q->whereIn('clinics.id', $managerClinicIds);
                        })
                        ->with([
                            'clinics' => function($q) use ($managerClinicIds) {
                                $q->whereIn('clinics.id', $managerClinicIds)
                                  ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                            },
                            'roles:id,name,alias',
                            'ownedClinics' => function($q) use ($managerClinicIds) {
                                $q->whereIn('clinics.id', $managerClinicIds)
                                  ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                            },
                        ]);
                } elseif ($staffType === 'clinic_manager') {
                $query = \App\Models\User::role('clinic_manager')
                    ->whereHas('clinics', function($q) use ($managerClinicIds) {
                        $q->whereIn('clinics.id', $managerClinicIds);
                    })
                    ->with([
                        'clinics' => function($q) use ($managerClinicIds) {
                            $q->whereIn('clinics.id', $managerClinicIds)
                              ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                        'roles:id,name,alias',
                    ]);
                } else {
                    // Default: show all staff for their clinics
                    $query = \App\Models\User::whereHas('clinics', function($q) use ($managerClinicIds) {
                        $q->whereIn('clinics.id', $managerClinicIds);
                    })
                    ->with([
                        'clinics' => function($q) use ($managerClinicIds) {
                            $q->whereIn('clinics.id', $managerClinicIds)
                              ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                        'roles:id,name',
                    ]);
                }
            }
        } elseif ($user->hasRole('clinic')) {
            // Clinic user: Show clinic staff only for their owned clinics
            // Clinic role users own clinics via owner_id, not via clinics() relationship
            $userClinicIds = $user->ownedClinics()->pluck('id')->toArray();
            
            // Also check if they have clinics via the clinics() relationship (for staff who are also clinic managers)
            $attachedClinicIds = $user->clinics()->pluck('clinics.id')->toArray();
            $userClinicIds = array_unique(array_merge($userClinicIds, $attachedClinicIds));
            
            if (empty($userClinicIds)) {
                // If user has no clinics, return empty result
                $query = \App\Models\User::whereRaw('1 = 0');
            } else {
                // Filter by staff_type to show either 'clinic' or 'clinic_manager' role users
                if ($staffType === 'clinic') {
                    $query = \App\Models\User::role('clinic')
                        ->whereHas('clinics', function($q) use ($userClinicIds) {
                            $q->whereIn('clinics.id', $userClinicIds);
                        })
                        ->with([
                            'clinics' => function($q) use ($userClinicIds) {
                                $q->whereIn('clinics.id', $userClinicIds)
                                  ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                            },
                            'roles:id,name,alias',
                            'ownedClinics' => function($q) use ($userClinicIds) {
                                $q->whereIn('clinics.id', $userClinicIds)
                                  ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                            },
                        ]);
                } elseif ($staffType === 'clinic_manager') {
                    $query = \App\Models\User::role('clinic_manager')
                        ->whereHas('clinics', function($q) use ($userClinicIds) {
                            $q->whereIn('clinics.id', $userClinicIds);
                        })
                        ->with([
                            'clinics' => function($q) use ($userClinicIds) {
                                $q->whereIn('clinics.id', $userClinicIds)
                                  ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                            },
                            'roles:id,name,alias',
                        ]);
                } else {
                    // Default: show all staff for their clinics
                $query = \App\Models\User::whereHas('clinics', function($q) use ($userClinicIds) {
                    $q->whereIn('clinics.id', $userClinicIds);
                })
                ->with([
                    'clinics' => function($q) use ($userClinicIds) {
                        $q->whereIn('clinics.id', $userClinicIds)
                          ->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                    },
                    'roles:id,name',
                ]);
                }
            }
        } else {
            // Other roles: Show based on staff type filter
            if ($staffType === 'clinic') {
                $query = \App\Models\User::role('clinic')
                    ->with([
                        'clinics' => function($q) {
                            $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                        'roles:id,name,alias',
                        'ownedClinics' => function($q) {
                            $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                    ]);
            } elseif ($staffType === 'clinic_manager') {
                $query = \App\Models\User::role('clinic_manager')
                    ->with([
                        'clinics' => function($q) {
                            $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                        },
                        'roles:id,name,alias',
                    ]);
            } else {
                $query = \App\Models\User::whereHas('clinics', function($q) {
                    $q->whereNotNull('clinic_users.clinic_id');
                })
                ->with([
                    'clinics' => function($q) {
                        $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar');
                    },
                    'roles:id,name',
                ]);
            }
        }

        // Exclude the logged-in user
        $query->where('id', '!=', $user->id);

        // Apply owner filter
        if (!empty($ownerId)) {
            $query->where(function($q) use ($ownerId) {
                $q->whereHas('ownedClinics', function($subQ) use ($ownerId) {
                    $subQ->where('clinics.owner_id', $ownerId);
                })->orWhereHas('clinics', function($subQ) use ($ownerId) {
                    $subQ->where('clinics.owner_id', $ownerId);
                });
            });
        }

        // Apply filters
        if (!empty($filters['clinic_id'])) {
            $query->whereHas('clinics', function($q) use ($filters) {
                $q->where('clinics.id', $filters['clinic_id']);
            });
        }

        if (!empty($filters['role'])) {
            $query->whereHas('roles', function($q) use ($filters) {
                $q->where('name', $filters['role']);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('phone', 'like', '%' . $filters['search'] . '%');
            });
        }

        $staff = $query->latest()->paginate($perPage);

        // Get clinics for filter dropdown - filter based on user role
        $clinicsQuery = \App\Models\Clinic::where('status', 'approved')
            ->whereHas('owner', function($q) {
                $q->where('status', 'active');
            });
        
        // Apply role-based filtering for clinics
        $clinicsQuery = $this->scopeClinicsForUser($clinicsQuery);
        $clinics = $clinicsQuery->orderBy('name_en')->get(['id', 'name_en', 'name_ar']);
        
        // Get owners for filter dropdown - use the trait method which handles role-based filtering
        $ownersCollection = $this->getApprovedClinicOwnersForDropdown();
        $owners = $ownersCollection->map(function($owner) {
            return [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
            ];
        })->values()->all();

        $filters['owner_id'] = $ownerId;
        $filters['staff_type'] = $staffType;

        return Inertia::render('dashboard/clinics-staff/index', [
            'staff' => $staff,
            'filters' => $filters,
            'clinics' => $clinics,
            'owners' => $owners,
        ]);
    }

    /**
     * Display the specified clinic staff member
     */
    public function show(int $id): Response
    {
        Gate::authorize('clinics-staff.show');

        $staff = \App\Models\User::with([
            'clinics' => function($q) {
                $q->select(
                    'clinics.id', 
                    'clinics.name_en', 
                    'clinics.name_ar', 
                    'clinics.owner_id',
                    'clinics.phone',
                    'clinics.email',
                    'clinics.address',
                    'clinics.status',
                    'clinics.governorate_id',
                    'clinics.area_id',
                    'clinics.created_at'
                )
                  ->with([
                      'owner:id,name,email,phone',
                      'governorate:id,name_en,name_ar',
                      'area:id,name_en,name_ar',
                  ]);
            },
            'roles:id,name,alias',
        ])->findOrFail($id);

        // Get the owner from the staff's clinics
        $owner = null;
        if ($staff->clinics->isNotEmpty()) {
            $firstClinic = $staff->clinics->first();
            if ($firstClinic && $firstClinic->owner) {
                $owner = $firstClinic->owner;
            } else {
                // Fallback: get owner by owner_id if relationship not loaded
                $ownerIds = $staff->clinics->pluck('owner_id')->unique();
                if ($ownerIds->count() === 1) {
                    $owner = \App\Models\User::find($ownerIds->first());
                }
            }
        }

        return Inertia::render('dashboard/clinics-staff/show', [
            'staff' => $staff,
            'owner' => $owner,
        ]);
    }

    /**
     * Show the form for editing the specified clinic staff member
     */
    public function edit(int $id): Response
    {
        Gate::authorize('clinics-staff.edit');

        $staff = \App\Models\User::with([
            'clinics' => function($q) {
                $q->select('clinics.id', 'clinics.name_en', 'clinics.name_ar', 'clinics.owner_id');
            },
            'roles:id,name',
        ])->findOrFail($id);

        $owners = $this->getApprovedClinicOwnersForDropdown();

        // Get the current owner from the staff's clinics (get the most common owner_id)
        $currentOwnerId = null;
        if ($staff->clinics->isNotEmpty()) {
            $ownerIds = $staff->clinics->pluck('owner_id')->unique();
            // If all clinics have the same owner, use that; otherwise use the first one
            $currentOwnerId = $ownerIds->count() === 1 ? $ownerIds->first() : $ownerIds->first();
        }

        return Inertia::render('dashboard/clinics-staff/edit', [
            'staff' => $staff,
            'users' => $owners,
            'currentOwnerId' => $currentOwnerId,
        ]);
    }

    /**
     * Update the specified clinic staff member
     */
    public function update(StaffUpdateRequest $request, int $id)
    {
        $validated = $request->validated();

        $staff = $this->userRepository->update($id, [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ]);

        // Convert clinic_ids to integers
        $clinicIds = array_map('intval', $validated['clinic_ids']);

        // Verify that all clinics belong to the selected owner
        $ownerClinics = \App\Models\Clinic::where('owner_id', $validated['owner_id'])
            ->pluck('id')
            ->toArray();
        
        $invalidClinics = array_diff($clinicIds, $ownerClinics);
        if (!empty($invalidClinics)) {
            return back()->withErrors([
                'clinic_ids' => __('common.clinic_ids_must_belong_to_owner')
            ])->withInput();
        }

        // Sync clinics
        $staff->clinics()->sync($clinicIds);

        // Ensure staff always has clinic_manager role
        $clinicManagerRole = \Spatie\Permission\Models\Role::where('name', 'clinic_manager')->first();
        if ($clinicManagerRole && !$staff->hasRole('clinic_manager')) {
            $staff->assignRole($clinicManagerRole);
        }

        return redirect()->route('dashboard.clinics-staff.edit', $id)
            ->with('success', __('common.staff_updated_successfully'));
    }

    /**
     * Remove staff from clinic
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('clinics-staff.destroy');

        // If clinic_id is provided, remove from that specific clinic only
        if ($request->filled('clinic_id')) {
        $validated = $request->validate([
            'clinic_id' => ['required', 'exists:clinics,id'],
        ]);
            
            $staff = \App\Models\User::findOrFail($id);
        $staff->clinics()->detach($validated['clinic_id']);
            
        return redirect()->route('dashboard.clinics-staff.index')
            ->with('success', __('common.staff_removed_from_clinic'));
        } else {
            // Delete the staff user completely (follows User model delete logic)
            // This will trigger soft delete, anonymization, and cascade deletion
            return $this->withTransaction(function () use ($id) {
                $staff = $this->userRepository->findOrFail($id);
                
                // Delete the user (this will trigger User model's deleting event)
                // which handles anonymization and cascade deletion
                $this->userRepository->delete($id);
                
            return redirect()->route('dashboard.clinics-staff.index')
                ->with('success', __('common.staff_deleted_successfully'));
            });
        }
    }
}
