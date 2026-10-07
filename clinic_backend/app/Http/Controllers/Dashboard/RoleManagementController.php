<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\RoleRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\RoleStoreRequest;
use App\Http\Requests\Dashboard\RoleUpdateRequest;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use App\Models\Role;

class RoleManagementController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected RoleRepositoryInterface $roleRepository
    ) {}

    /**
     * Display a listing of roles
     */
    public function index(Request $request): Response
    {
        Gate::authorize('roles.view');
        
        $perPage = $request->get('per_page', 15);
        $roles = $this->roleRepository->getPaginated($request, $perPage);

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/roles/index', [
            'roles' => $roles,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new role
     */
    public function create(): Response
    {
        Gate::authorize('roles.create');
        
        $permissionGroups = $this->getGroupedPermissions();

        return Inertia::render('dashboard/roles/create', [
            'permissionGroups' => $permissionGroups,
        ]);
    }

    /**
     * Store a newly created role
     */
    public function store(RoleStoreRequest $request)
    {
        Gate::authorize('roles.create');
        
        $this->withTransaction(function () use ($request) {
            $validated = $request->validated();
            $permissions = $validated['permissions'] ?? [];

            $this->roleRepository->createWithPermissions(
                [
                    'name' => $validated['name'], 
                    'alias' => $validated['alias'],
                    'guard_name' => $validated['guard_name']
                ],
                $permissions
            );
        });

        return redirect()
            ->route('dashboard.roles.index')
            ->with('success', __('common.role_created_successfully'));
    }

    /**
     * Display the specified role
     */
    public function show(int $id): Response
    {
        Gate::authorize('roles.show');
        
        $role = $this->roleRepository->getWithPermissions($id);
        
        // Ensure dashboard.view is always included in role permissions
        $permissionNames = $role->permissions->pluck('name')->toArray();
        if (!in_array('dashboard.view', $permissionNames)) {
            $permissionNames[] = 'dashboard.view';
            $role->permissions = \Spatie\Permission\Models\Permission::whereIn('name', $permissionNames)->get();
        }
        
        $permissionGroups = $this->getGroupedPermissions();

        return Inertia::render('dashboard/roles/show', [
            'role' => $role,
            'permissionGroups' => $permissionGroups,
        ]);
    }

    /**
     * Show the form for editing the specified role
     */
    public function edit(int $id): Response
    {
        Gate::authorize('roles.edit');
        
        $role = $this->roleRepository->getWithPermissions($id);
        
        // Ensure dashboard.view is always included in role permissions
        $permissionNames = $role->permissions->pluck('name')->toArray();
        if (!in_array('dashboard.view', $permissionNames)) {
            $permissionNames[] = 'dashboard.view';
            $role->permissions = \Spatie\Permission\Models\Permission::whereIn('name', $permissionNames)->get();
        }
        
        $permissionGroups = $this->getGroupedPermissions();

        return Inertia::render('dashboard/roles/edit', [
            'role' => $role,
            'permissionGroups' => $permissionGroups,
        ]);
    }

    /**
     * Update the specified role
     */
    public function update(RoleUpdateRequest $request, int $id)
    {
        Gate::authorize('roles.edit');
        
        $this->withTransaction(function () use ($request, $id) {
            $role = $this->roleRepository->findOrFail($id);

            // Prevent modification of system roles
            if (PermissionSeeder::isSystemRole($role->name)) {
                abort(403, __('common.cannot_modify_system_role'));
            }

            $validated = $request->validated();
            $permissions = $validated['permissions'] ?? [];

            $this->roleRepository->updateWithPermissions(
                $id,
                [
                    'name' => $validated['name'], 
                    'alias' => $validated['alias'],
                    'guard_name' => $validated['guard_name']
                ],
                $permissions
            );
        });

        return redirect()
            ->route('dashboard.roles.edit', $id)
            ->with('success', __('common.role_updated_successfully'));
    }

    /**
     * Remove the specified role
     */
    public function destroy(int $id)
    {
        Gate::authorize('roles.destroy');
        
        $this->withTransaction(function () use ($id) {
            $role = $this->roleRepository->findOrFail($id);

            // Prevent deletion of system roles
            if (PermissionSeeder::isSystemRole($role->name)) {
                abort(403, __('common.cannot_delete_system_role'));
            }

            // Check if role has users
            if ($role->users()->count() > 0) {
                abort(403, __('common.cannot_delete_role_with_users'));
            }

            $this->roleRepository->delete($id);
        });

        return redirect()
            ->route('dashboard.roles.index')
            ->with('success', __('common.role_deleted_successfully'));
    }

    /**
     * Get grouped permissions for UI display based on sidebar structure
     */
    protected function getGroupedPermissions(): array
    {
        $permissionGroups = PermissionSeeder::getPermissionGroups();
        $allPermissions = Permission::all()->pluck('name')->toArray();

        $organizedGroups = [];

        foreach ($permissionGroups as $groupName => $permissions) {
            // Create sub-groups based on permission prefixes first
            $subGroups = $this->createSubGroupsFromPermissions($permissions, $allPermissions);
            
            // Get all permissions that are in sub-groups to exclude from main group
            $subGroupPermissions = [];
            foreach ($subGroups as $subGroup) {
                $subGroupPermissions = array_merge(
                    $subGroupPermissions,
                    $subGroup['permissions']['create'],
                    $subGroup['permissions']['read'],
                    $subGroup['permissions']['update'],
                    $subGroup['permissions']['delete'],
                    $subGroup['permissions']['others']
                );
            }
            $subGroupPermissions = array_unique($subGroupPermissions);
            
            // Only organize permissions that are NOT in sub-groups for the main group
            $mainGroupPermissions = array_diff($permissions, $subGroupPermissions);
            $organized = $this->organizePermissionsByCRUD($mainGroupPermissions, $allPermissions);
            
            // Count total permissions (main group + all sub-groups)
            $mainCount = count($organized['create']) + count($organized['read']) + 
                         count($organized['update']) + count($organized['delete']) + 
                         count($organized['others']);
            
            $subGroupsCount = array_sum(array_column($subGroups, 'count'));
            $totalCount = $mainCount + $subGroupsCount;

            if ($totalCount > 0) {
                $organizedGroups[$groupName] = [
                    'permissions' => $organized,
                    'count' => $totalCount,
                    'subGroups' => $subGroups,
                ];
            }
        }

        return $organizedGroups;
    }

    /**
     * Create sub-groups from permissions based on their prefixes
     */
    protected function createSubGroupsFromPermissions(array $permissions, array $allPermissions): array
    {
        $subGroupsMap = [];
        
        foreach ($permissions as $permission) {
            if (!in_array($permission, $allPermissions)) {
                continue;
            }
            
            // Extract prefix (e.g., 'users', 'roles', 'admins' from 'users.view', 'roles.create', etc.)
            $parts = explode('.', $permission);
            if (count($parts) < 2) {
                continue;
            }
            
            $prefix = $parts[0];
            
            // Handle special cases
            if ($prefix === 'site-settings') {
                $prefix = 'site-settings.' . $parts[1]; // e.g., 'site-settings.general'
            }
            
            if (!isset($subGroupsMap[$prefix])) {
                $subGroupsMap[$prefix] = [];
            }
            
            // Only add if not already in the array (prevent duplicates)
            if (!in_array($permission, $subGroupsMap[$prefix])) {
                $subGroupsMap[$prefix][] = $permission;
            }
        }
        
        $subGroups = [];
        $seenDisplayNames = []; // Track display names to prevent duplicates
        
        foreach ($subGroupsMap as $subGroupName => $subGroupPermissions) {
            // Remove any duplicates from subGroupPermissions
            $subGroupPermissions = array_unique($subGroupPermissions);
            
            $organized = $this->organizePermissionsByCRUD($subGroupPermissions, $allPermissions);
            
            $totalCount = count($organized['create']) + count($organized['read']) + 
                         count($organized['update']) + count($organized['delete']) + 
                         count($organized['others']);
            
            if ($totalCount > 0) {
                // Format sub-group name for display
                $displayName = $this->formatSubGroupName($subGroupName);
                
                // Prevent duplicate display names by appending the original prefix if needed
                $uniqueDisplayName = $displayName;
                $counter = 1;
                while (isset($seenDisplayNames[$uniqueDisplayName])) {
                    $uniqueDisplayName = $displayName . ' (' . $subGroupName . ')';
                    $counter++;
                }
                $seenDisplayNames[$uniqueDisplayName] = true;
                
                $subGroups[] = [
                    'name' => $uniqueDisplayName,
                    'permissions' => $organized,
                    'count' => $totalCount,
                ];
            }
        }
        
        // Sort sub-groups by name
        usort($subGroups, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });
        
        return $subGroups;
    }

    /**
     * Format sub-group name for display
     */
    protected function formatSubGroupName(string $name): string
    {
        // Handle special cases first (before converting to title case)
        $specialCases = [
            'clinics-bookings' => 'Clinics Bookings',
            'clinics-address' => 'Clinics Address',
            'clinics-operating-hours' => 'Clinics Operating Hours',
            'clinics-subscriptions' => 'Clinics Subscriptions',
            'clinics-payouts' => 'Clinics Payouts',
            'clinics-staff' => 'Clinics Staff',
            'clinic-subscriptions' => 'Clinic Subscriptions',
            'treatment-slots' => 'Treatment Slots',
            'subscription-packages' => 'Subscription Packages',
            'payment-methods' => 'Payment Methods',
            'activity-logs' => 'Activity Logs',
            'booking-documents' => 'Booking Documents',
            'site-settings.general' => 'Site Settings - General',
            'site-settings.vendor' => 'Site Settings - Vendor',
            'site-settings.contact' => 'Site Settings - Contact',
            'site-settings.terms' => 'Site Settings - Terms',
            'site-settings.privacy' => 'Site Settings - Privacy',
            'site-settings.loyalty' => 'Site Settings - Loyalty',
            'site-settings.communication' => 'Site Settings - Communication',
            'site-settings.myfatoorah' => 'Site Settings - MyFatoorah',
            'site-settings.support' => 'Site Settings - Support',
        ];
        
        if (isset($specialCases[$name])) {
            return $specialCases[$name];
        }
        
        // Convert kebab-case or snake_case to Title Case
        $formattedName = str_replace(['-', '_'], ' ', $name);
        $formattedName = ucwords($formattedName);
        
        // Handle remaining special cases
        $replacements = [
            'Users' => 'Users Management',
            'Roles' => 'Role Management',
            'Admins' => 'Admin Management',
            'Clinics' => 'Clinics Management',
            'Categories' => 'Categories Management',
            'Treatments' => 'Treatments Management',
            'Machines' => 'Machines Management',
            'Reviews' => 'Reviews Management',
            'Favorites' => 'Favorites Management',
            'Governorates' => 'Governorates Management',
            'Areas' => 'Areas Management',
            'Banners' => 'Banners Management',
            'Bookings' => 'Bookings Management',
            'Reviews' => 'Reviews Management',
            'Contacts' => 'Contacts Management',
            'Faqs' => 'FAQs Management',
            'Transactions' => 'Transactions Management',
            'Payouts' => 'Payouts Management',
            'Medical Records' => 'Medical Records Management',
            'Notifications' => 'Notifications Management',
            'Broadcasts' => 'Broadcast Management',
            'Profile' => 'Profile Settings',
            'Password' => 'Password Settings',
            'Two Factor' => 'Two-Factor Authentication',
        ];
        
        foreach ($replacements as $key => $value) {
            if (str_starts_with($formattedName, $key)) {
                return $value;
            }
        }
        
        return $formattedName;
    }

    /**
     * Organize permissions by CRUD operations
     */
    protected function organizePermissionsByCRUD(array $permissions, array $allPermissions): array
    {
        $organized = [
            'create' => [],
            'read' => [],
            'update' => [],
            'delete' => [],
            'others' => [],
        ];

        // Remove duplicates from input permissions
        $permissions = array_unique($permissions);

        foreach ($permissions as $permission) {
            if (!in_array($permission, $allPermissions)) {
                continue;
            }

            // Determine the category based on permission name
            if (str_contains($permission, '.create') || str_contains($permission, '.store')) {
                if (!in_array($permission, $organized['create'])) {
                    $organized['create'][] = $permission;
                }
            } elseif (str_contains($permission, '.view') || str_contains($permission, '.show')) {
                if (!in_array($permission, $organized['read'])) {
                    $organized['read'][] = $permission;
                }
            } elseif (str_contains($permission, '.edit')) {
                // .edit handles both viewing edit form and updating
                if (!in_array($permission, $organized['update'])) {
                    $organized['update'][] = $permission;
                }
            } elseif (str_contains($permission, '.delete') || str_contains($permission, '.destroy')) {
                if (!in_array($permission, $organized['delete'])) {
                    $organized['delete'][] = $permission;
                }
            } else {
                if (!in_array($permission, $organized['others'])) {
                    $organized['others'][] = $permission;
                }
            }
        }

        return $organized;
    }
}
