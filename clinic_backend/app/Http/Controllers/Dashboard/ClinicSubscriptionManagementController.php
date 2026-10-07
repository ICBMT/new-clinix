<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\ClinicSubscriptionRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ClinicSubscriptionStoreRequest;
use App\Models\ClinicSubscription;
use App\Models\SubscriptionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClinicSubscriptionManagementController extends Controller
{
    public function __construct(
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly ClinicSubscriptionRepositoryInterface $clinicSubscriptionRepository
    ) {}

    /**
     * Display a listing of all clinic subscriptions
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics-subscriptions.view');

        $perPage = $request->get('per_page', 15);
        $query = ClinicSubscription::with(['clinic', 'subscriptionPackage']);
        
        // Get filters from request (support both nested filters and root level)
        $filters = $request->get('filters', []);
        $clinicId = $filters['clinic_id'] ?? $request->get('clinic_id');
        $status = $filters['status'] ?? $request->get('status');
        $packageId = $filters['package_id'] ?? $request->get('package_id');
        $search = $request->get('search');

        // Apply filters
        if ($clinicId) {
            $query->where('clinic_id', $clinicId);
        }
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($packageId) {
            $query->where('subscription_package_id', $packageId);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('cancellation_reason', 'LIKE', "%{$search}%")
                  ->orWhereHas('clinic', function ($clinicQuery) use ($search) {
                      $clinicQuery->where('name_en', 'LIKE', "%{$search}%")
                                  ->orWhere('name_ar', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('subscriptionPackage', function ($packageQuery) use ($search) {
                      $packageQuery->where('name_en', 'LIKE', "%{$search}%")
                                   ->orWhere('name_ar', 'LIKE', "%{$search}%");
                  });
            });
        }

        $subscriptions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Ensure relationships are loaded for all items in the collection
        $subscriptions->getCollection()->loadMissing(['clinic', 'subscriptionPackage']);

        // Get clinics for filter dropdown
        $clinics = $this->clinicRepository->getActiveClinics();
        // Get subscription packages for filter
        $packages = SubscriptionPackage::where('status', 'active')->get();

        return Inertia::render('dashboard/clinics-subscriptions/index', [
            'subscriptions' => $subscriptions,
            'filters' => [
                'clinic_id' => $clinicId,
                'status' => $status,
                'package_id' => $packageId,
                'search' => $search,
            ],
            'clinics' => $clinics,
            'packages' => $packages,
        ]);
    }

    /**
     * Show the form for creating a new clinic subscription
     */
    public function create(): Response
    {
        Gate::authorize('clinics-subscriptions.create');

        // Get clinics for dropdown
        $clinics = $this->clinicRepository->getActiveClinics();
        // Get subscription packages for dropdown
        $packages = SubscriptionPackage::where('status', 'active')->get();

        return Inertia::render('dashboard/clinics-subscriptions/create', [
            'clinics' => $clinics,
            'packages' => $packages,
        ]);
    }

    /**
     * Store a newly created clinic subscription
     */
    public function store(ClinicSubscriptionStoreRequest $request)
    {
        Gate::authorize('clinics-subscriptions.create');

        $validated = $request->validated();

        $this->withTransaction(function () use ($validated) {
            // Get package to calculate end date and amount if not provided
            $package = SubscriptionPackage::find($validated['subscription_package_id']);
            
            // Set amount and currency from package if not provided
            if ($package) {
                if (!isset($validated['amount_paid']) || $validated['amount_paid'] == 0) {
                    $validated['amount_paid'] = $package->price ?? 0;
                }
                if (!isset($validated['currency'])) {
                    $validated['currency'] = $package->currency ?? 'KWD';
                }
                
                // Calculate end date if not provided
                if (!isset($validated['end_date']) || empty($validated['end_date'])) {
                    $startDate = \Carbon\Carbon::parse($validated['start_date']);
                    $validated['end_date'] = $startDate->copy()->addDays($package->duration_days ?? 30)->toDateString();
                }
            }

            // Convert empty string to null for optional fields
            if (isset($validated['transaction_id']) && $validated['transaction_id'] === '') {
                $validated['transaction_id'] = null;
            }
            if (isset($validated['cancellation_reason']) && $validated['cancellation_reason'] === '') {
                $validated['cancellation_reason'] = null;
            }

            // Create subscription
            $subscription = $this->clinicSubscriptionRepository->create($validated);

            // Link subscription to clinic
            $clinic = \App\Models\Clinic::find($validated['clinic_id']);
            if ($clinic) {
                $clinic->subscription_id = $subscription->id;
                $clinic->save();
            }
        });

        return redirect()->route('dashboard.clinics-subscriptions.index')
            ->with('success', __('common.subscription_created_successfully'));
    }

    /**
     * Display the specified clinic subscription
     */
    public function show(int $id): Response
    {
        Gate::authorize('clinics-subscriptions.show');

        $subscription = ClinicSubscription::with([
            'clinic:id,name_en,name_ar',
            'subscriptionPackage:id,name_en,name_ar',
            'transaction:id,transaction_id,amount',
        ])->findOrFail($id);

        return Inertia::render('dashboard/clinics-subscriptions/show', [
            'subscription' => $subscription,
        ]);
    }

    /**
     * Show the form for editing the specified clinic subscription
     */
    public function edit(int $id): Response
    {
        Gate::authorize('clinics-subscriptions.edit');

        $subscription = ClinicSubscription::with([
            'clinic:id,name_en,name_ar',
            'subscriptionPackage:id,name_en,name_ar',
        ])->findOrFail($id);

        // Get subscription packages for dropdown
        $packages = SubscriptionPackage::where('status', 'active')->get();

        return Inertia::render('dashboard/clinics-subscriptions/edit', [
            'subscription' => $subscription,
            'packages' => $packages,
        ]);
    }

    /**
     * Update the specified clinic subscription
     */
    public function update(Request $request, int $id)
    {
        Gate::authorize('clinics-subscriptions.edit');

        $validated = $request->validate([
            'subscription_package_id' => ['required', 'exists:subscription_packages,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', 'in:active,inactive,expired,cancelled'],
            'auto_renew' => ['nullable', 'boolean'],
        ]);

        $this->withTransaction(function () use ($id, $validated) {
            $subscription = ClinicSubscription::findOrFail($id);
            $subscription->update($validated);
        });

        return redirect()->route('dashboard.clinics-subscriptions.edit', $id)
            ->with('success', __('common.subscription_updated_successfully'));
    }

    /**
     * Toggle clinic subscription status
     */
    public function toggleStatus(Request $request, int $id)
    {
        Gate::authorize('clinics-subscriptions.toggle-status');

        $request->validate([
            'status' => ['required', 'in:active,inactive,expired,cancelled'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            ClinicSubscription::where('id', $id)->update([
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.subscription_updated_successfully'));
    }
}
