<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\SubscriptionPackageStoreRequest;
use App\Http\Requests\Dashboard\SubscriptionPackageUpdateRequest;
use App\Models\SubscriptionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionPackageManagementController extends Controller
{
    /**
     * Display a listing of subscription packages
     */
    public function index(Request $request): Response
    {
        Gate::authorize('subscription-packages.view');

        $perPage = $request->get('per_page', 15);
        $query = SubscriptionPackage::query();

        // Get filters from request (support both nested filters and root level)
        $filters = $request->get('filters', []);
            $search = $request->get('search');
        $status = $filters['status'] ?? $request->get('status');
        $featured = $filters['featured'] ?? $request->input('filters.featured') ?? $request->input('featured');

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('name_ar', 'LIKE', "%{$search}%")
                  ->orWhere('description_en', 'LIKE', "%{$search}%")
                  ->orWhere('description_ar', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        
        // Handle featured filter
        if ($featured && $featured !== 'all') {
            if ($featured === 'true' || $featured === true || $featured === '1') {
                $query->where('featured_listing', true);
            } elseif ($featured === 'false' || $featured === false || $featured === '0') {
                $query->where('featured_listing', false);
            }
        }

        $packages = $query->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Prepare filters for frontend
        $frontendFilters = [
            'search' => $search,
            'status' => $status,
            'featured' => $featured,
        ];

        return Inertia::render('dashboard/subscription-packages/index', [
            'packages' => $packages,
            'filters' => $frontendFilters,
        ]);
    }

    /**
     * Show the form for creating a new subscription package
     */
    public function create(): Response
    {
        Gate::authorize('subscription-packages.create');

        return Inertia::render('dashboard/subscription-packages/create');
    }

    /**
     * Store a newly created subscription package in storage
     */
    public function store(SubscriptionPackageStoreRequest $request)
    {
        $this->withTransaction(function () use ($request) {
            $data = $request->only([
                'name_en', 'name_ar', 'description_en', 'description_ar',
                'price', 'currency', 'billing_cycle', 'duration_days',
                'features', 'max_services', 'max_bookings_per_month',
                'featured_listing', 'priority_support', 'analytics_access',
                'custom_branding', 'status', 'sort_order'
            ]);

            // Convert empty strings to null for nullable fields
            $nullableFields = ['description_en', 'description_ar', 'max_services', 'max_bookings_per_month'];
            foreach ($nullableFields as $field) {
                if (array_key_exists($field, $data)) {
                    if ($data[$field] === '' || $data[$field] === null) {
                        $data[$field] = null;
                    }
                }
            }

            return SubscriptionPackage::create($data);
        });

        return redirect()->route('dashboard.subscription-packages.index')
            ->with('success', __('common.subscription_package_created_successfully'));
    }

    /**
     * Display the specified subscription package
     */
    public function show(int $id): Response
    {
        Gate::authorize('subscription-packages.show');

        $package = SubscriptionPackage::withCount('subscriptions')->findOrFail($id);

        return Inertia::render('dashboard/subscription-packages/show', [
            'package' => $package,
        ]);
    }

    /**
     * Show the form for editing the specified subscription package
     */
    public function edit(int $id): Response
    {
        Gate::authorize('subscription-packages.edit');

        $package = SubscriptionPackage::findOrFail($id);

        return Inertia::render('dashboard/subscription-packages/edit', [
            'package' => $package,
        ]);
    }

    /**
     * Update the specified subscription package in storage
     */
    public function update(SubscriptionPackageUpdateRequest $request, int $id)
    {
        $this->withTransaction(function () use ($request, $id) {
            // Use validated() to get properly validated and typed data
            $data = $request->validated();

            // Ensure integer fields are explicitly cast to prevent any type issues
            if (isset($data['duration_days'])) {
                $data['duration_days'] = (int) $data['duration_days'];
            }
            if (isset($data['max_services']) && $data['max_services'] !== null) {
                $data['max_services'] = (int) $data['max_services'];
            }
            if (isset($data['max_bookings_per_month']) && $data['max_bookings_per_month'] !== null) {
                $data['max_bookings_per_month'] = (int) $data['max_bookings_per_month'];
            }
            if (isset($data['sort_order']) && $data['sort_order'] !== null) {
                $data['sort_order'] = (int) $data['sort_order'];
            }

            SubscriptionPackage::where('id', $id)->update($data);
        });

        return redirect()->route('dashboard.subscription-packages.edit', $id)
            ->with('success', __('common.subscription_package_updated_successfully'));
    }

    /**
     * Remove the specified subscription package from storage
     */
    public function destroy(int $id)
    {
        Gate::authorize('subscription-packages.destroy');

        $this->withTransaction(function () use ($id) {
            SubscriptionPackage::where('id', $id)->delete();
        });

        return redirect()->route('dashboard.subscription-packages.index')
            ->with('success', __('common.subscription_package_deleted_successfully'));
    }

    /**
     * Toggle subscription package status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('subscription-packages.toggle-status');

        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            SubscriptionPackage::where('id', $id)->update([
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.subscription_package_updated_successfully'));
    }

    /**
     * Toggle featured status
     */
    public function toggleFeatured(Request $request, int $id)
    {
        Gate::authorize('subscription-packages.toggle-featured');

        $request->validate([
            'featured_listing' => ['sometimes', 'boolean'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $package = SubscriptionPackage::findOrFail($id);
            $newFeaturedStatus = $request->has('featured_listing') 
                ? $request->input('featured_listing') 
                : !$package->featured_listing;
            
            SubscriptionPackage::where('id', $id)->update([
                'featured_listing' => $newFeaturedStatus,
            ]);
        });

        return back()->with('success', __('common.subscription_package_updated_successfully'));
    }
}

