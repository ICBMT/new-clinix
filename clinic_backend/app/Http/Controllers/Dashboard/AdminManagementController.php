<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\AdminStoreRequest;
use App\Http\Requests\Dashboard\AdminUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Role;

class AdminManagementController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    /**
     * Display a listing of admin users
     */
    public function index(Request $request): Response
    {
        Gate::authorize('admins.view');
        
        $perPage = $request->get('per_page', 15);

        // Get users with admin roles (excluding user and vendor roles)
        $admins = $this->userRepository->getAdminUsersPaginated($request, $perPage);
        
        // Load roles with alias for each admin
        $admins->getCollection()->transform(function ($admin) {
            $admin->load(['roles:id,name,alias']);
            return $admin;
        });

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/admins/index', [
            'admins' => $admins,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new admin
     */
    public function create(): Response
    {
        Gate::authorize('admins.create');
        
        // Get available roles for admin management (excluding system roles, clinic, and clinic_manager)
        $availableRoles = Role::whereNotIn('name', ['user', 'guest', 'super-admin', 'clinic', 'clinic_manager'])
            ->select('name', 'alias')
            ->get()
            ->map(function ($role) {
                return [
                    'value' => $role->name,
                    'label' => $role->alias ?? ucfirst($role->name),
                ];
            });

        return Inertia::render('dashboard/admins/create', [
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Store a newly created admin in storage
     */
    public function store(AdminStoreRequest $request)
    {
        Gate::authorize('admins.create');
        
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();

            // Create admin user
            $admin = $this->userRepository->create($data);

            // Assign admin role based on request
            $role = $data['role'] ?? 'admin';
            $admin->assignRole($role);

            return $admin;
        });

        return redirect()->route('dashboard.admins.index')
            ->with('success', __('common.admin_created_successfully'));
    }

    /**
     * Display the specified admin
     */
    public function show(int $id): Response
    {
        Gate::authorize('admins.show');
        
        $admin = $this->userRepository->findOrFail($id);

        return Inertia::render('dashboard/admins/show', [
            'admin' => $admin,
        ]);
    }

    /**
     * Show the form for editing the specified admin
     */
    public function edit(int $id): Response
    {
        Gate::authorize('admins.edit');
        
        $admin = $this->userRepository->findOrFail($id);

        // Load roles relationship
        $admin->load('roles:id,name,alias');

        // Get available roles for admin management (excluding system roles, clinic, and clinic_manager)
        $availableRoles = Role::whereNotIn('name', ['user', 'guest', 'super-admin', 'clinic', 'clinic_manager'])
            ->select('name', 'alias')
            ->get()
            ->map(function ($role) {
                return [
                    'value' => $role->name,
                    'label' => $role->alias ?? ucfirst($role->name),
                ];
            });

        return Inertia::render('dashboard/admins/edit', [
            'admin' => $admin,
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Update the specified admin in storage
     */
    public function update(AdminUpdateRequest $request, $admin)
    {
        Gate::authorize('admins.edit');
        
        // Get admin ID - handle both model instance and ID
        $adminId = is_object($admin) ? $admin->id : (int) $admin;
        
        $admin = $this->withTransaction(function () use ($request, $adminId) {
            $data = $request->validated();

            // Remove password if not provided
            if (empty($data['password'])) {
                unset($data['password']);
            }

            $admin = $this->userRepository->update($adminId, $data);

            // Update role if provided
            if (isset($data['role'])) {
                $admin->syncRoles([$data['role']]);
            }

            return $admin;
        });

        return redirect()->route('dashboard.admins.edit', $adminId)
            ->with('success', __('common.admin_updated_successfully'));
    }

    /**
     * Remove the specified admin from storage
     */
    public function destroy(Request $request, int $id)
    {
        Gate::authorize('admins.destroy');
        
        $this->withTransaction(function () use ($request, $id) {
            $admin = $this->userRepository->findOrFail($id);

            // Prevent deletion of super-admin
            if ($admin->hasRole('super-admin')) {
                abort(403, __('common.cannot_delete_super_admin'));
            }

            $this->userRepository->delete($id);
        });

        return redirect()->route('dashboard.admins.index')
            ->with('success', __('common.admin_deleted_successfully'));
    }

    /**
     * Toggle email verification status
     */
    public function toggleEmailVerification(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('admins.toggle-email-verification');
        
        $request->validate([
            'verified' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $verified = $request->input('verified');

            $this->userRepository->update($id, [
                'email_verified_at' => $verified ? now() : null,
            ]);
        });

        return back()->with('success', __('common.admin_updated_successfully'));
    }

    /**
     * Toggle phone verification status
     */
    public function togglePhoneVerification(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('admins.toggle-phone-verification');
        $request->validate([
            'verified' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $verified = $request->input('verified');

            $this->userRepository->update($id, [
                'phone_verified_at' => $verified ? now() : null,
            ]);
        });

        return back()->with('success', __('common.admin_updated_successfully'));
    }

    /**
     * Toggle admin status (active/inactive)
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('admins.toggle-status');
        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $status = $request->input('status');
            
            $this->userRepository->update($id, [
                'status' => $status,
            ]);
        });

        return back()->with('success', __('common.admin_updated_successfully'));
    }
}
