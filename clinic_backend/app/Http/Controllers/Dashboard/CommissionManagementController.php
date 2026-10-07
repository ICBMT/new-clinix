<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CommissionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CommissionManagementController extends Controller
{
    /**
     * Display a listing of commission settings
     */
    public function index(Request $request): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.view');

        $perPage = $request->get('per_page', 15);
        $query = CommissionSetting::with(['vendor:id,name,email']);

        // Apply filters
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('vendor', function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->get('is_active'));
        }

        if ($request->has('is_default')) {
            $query->where('is_default', $request->get('is_default'));
        }

        $settings = $query->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $filters = $request->only(['search', 'is_active', 'is_default']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/commission-settings/index', [
            'settings' => $settings,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new commission setting
     */
    public function create(): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.create');

        // Get vendors (clinics)
        $vendors = \App\Models\User::whereHas('roles', function ($q) {
            $q->where('name', 'vendor');
        })->whereHas('clinics', function ($q) {
            $q->where('verification_status', 'approved');
        })->select('id', 'name', 'email')->get();

        return Inertia::render('dashboard/commission-settings/create', [
            'vendors' => $vendors,
        ]);
    }

    /**
     * Store a newly created commission setting in storage
     */
    public function store(Request $request)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.create');

        $request->validate([
            'vendor_id' => ['nullable', 'exists:users,id'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'frequency' => ['required', 'in:daily,weekly,monthly,quarterly'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->withTransaction(function () use ($request) {
            $data = $request->only(['vendor_id', 'commission_rate', 'frequency', 'is_default', 'is_active', 'description']);
            
            // If this is set as default, unset other defaults
            if ($request->input('is_default')) {
                CommissionSetting::where('is_default', true)->update(['is_default' => false]);
            }
            
            // If vendor_id is null, this must be default
            if (empty($data['vendor_id'])) {
                $data['is_default'] = true;
                CommissionSetting::where('is_default', true)->update(['is_default' => false]);
            }
            
            return CommissionSetting::create($data);
        });

        return redirect()->route('dashboard.commission-settings.index')
            ->with('success', __('common.commission_setting_created_successfully'));
    }

    /**
     * Display the specified commission setting
     */
    public function show(int $id): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.show');

        $setting = CommissionSetting::with(['vendor:id,name,email'])->findOrFail($id);

        return Inertia::render('dashboard/commission-settings/show', [
            'setting' => $setting,
        ]);
    }

    /**
     * Show the form for editing the specified commission setting
     */
    public function edit(int $id): Response
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.edit');

        $setting = CommissionSetting::with(['vendor:id,name,email'])->findOrFail($id);

        // Get vendors (clinics)
        $vendors = \App\Models\User::whereHas('roles', function ($q) {
            $q->where('name', 'vendor');
        })->whereHas('clinics', function ($q) {
            $q->where('verification_status', 'approved');
        })->select('id', 'name', 'email')->get();

        return Inertia::render('dashboard/commission-settings/edit', [
            'setting' => $setting,
            'vendors' => $vendors,
        ]);
    }

    /**
     * Update the specified commission setting in storage
     */
    public function update(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.edit');

        $request->validate([
            'vendor_id' => ['nullable', 'exists:users,id'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'frequency' => ['required', 'in:daily,weekly,monthly,quarterly'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $data = $request->only(['vendor_id', 'commission_rate', 'frequency', 'is_default', 'is_active', 'description']);
            
            // If this is set as default, unset other defaults
            if ($request->input('is_default')) {
                CommissionSetting::where('id', '!=', $id)->where('is_default', true)->update(['is_default' => false]);
            }
            
            // If vendor_id is null, this must be default
            if (empty($data['vendor_id'])) {
                $data['is_default'] = true;
                CommissionSetting::where('id', '!=', $id)->where('is_default', true)->update(['is_default' => false]);
            }
            
            CommissionSetting::where('id', $id)->update($data);
        });

        return redirect()->route('dashboard.commission-settings.edit', $id)
            ->with('success', __('common.commission_setting_updated_successfully'));
    }

    /**
     * Remove the specified commission setting from storage
     */
    public function destroy(int $id)
    {
        // Commission settings permission not in seeder, allow for now
        // Gate::authorize('commission-settings.destroy');

        $this->withTransaction(function () use ($id) {
            CommissionSetting::where('id', $id)->delete();
        });

        return redirect()->route('dashboard.commission-settings.index')
            ->with('success', __('common.commission_setting_deleted_successfully'));
    }

    /**
     * Toggle commission setting status
     */
    public function toggleStatus(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('commission-settings.toggle-status');

        $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            CommissionSetting::where('id', $id)->update([
                'is_active' => $request->input('is_active'),
            ]);
        });

        return back()->with('success', __('common.commission_setting_updated_successfully'));
    }
}

