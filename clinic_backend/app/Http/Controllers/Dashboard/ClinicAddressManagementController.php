<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ClinicRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClinicAddressManagementController extends Controller
{
    public function __construct(
        private readonly ClinicRepositoryInterface $clinicRepository
    ) {}

    /**
     * Display a listing of all clinic addresses
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics-address.view');

        $perPage = $request->get('per_page', 15);
        $filters = $request->only(['clinic_id', 'governorate_id', 'area_id', 'search', 'status']);

        // Get clinics with address information
        $query = Clinic::with([
            'governorate:id,name_en,name_ar',
            'area:id,name_en,name_ar',
            'owner:id,name,email',
        ])->select([
            'id', 'name_en', 'name_ar', 'owner_id',
            'governorate_id', 'area_id', 'block', 'street', 'avenue',
            'house', 'floor', 'apt', 'city', 'state', 'country',
            'postal_code', 'latitude', 'longitude', 'address', 'phone', 'created_at'
        ]);

        // Apply filters
        if ($request->filled('clinic_id')) {
            $query->where('id', $request->clinic_id);
        }

        if ($request->filled('governorate_id')) {
            $query->where('governorate_id', $request->governorate_id);
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name_en', 'like', '%' . $request->search . '%')
                  ->orWhere('name_ar', 'like', '%' . $request->search . '%')
                  ->orWhere('address', 'like', '%' . $request->search . '%')
                  ->orWhere('block', 'like', '%' . $request->search . '%')
                  ->orWhere('street', 'like', '%' . $request->search . '%')
                  ->orWhere('city', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $clinics = $query->latest()->paginate($perPage);

        // Get clinics for filter dropdown
        $allClinics = $this->clinicRepository->getActiveClinics();
        // Get governorates and areas for filters
        $governorates = \App\Models\Governorate::where('is_active', true)
            ->select('id', 'name_en', 'name_ar', 'is_active')
            ->get();
        $areas = \App\Models\Area::where('is_active', true)
            ->select('id', 'name_en', 'name_ar', 'governorate_id', 'is_active')
            ->get();

        return Inertia::render('dashboard/clinics-address/index', [
            'clinics' => $clinics,
            'filters' => $filters,
            'allClinics' => $allClinics,
            'governorates' => $governorates,
            'areas' => $areas,
        ]);
    }

    /**
     * Display the specified clinic address
     */
    public function show(int $id): Response
    {
        Gate::authorize('clinics-address.show');

        $clinic = Clinic::with([
            'governorate:id,name_en,name_ar',
            'area:id,name_en,name_ar',
            'owner:id,name,email,phone',
        ])->findOrFail($id);

        return Inertia::render('dashboard/clinics-address/show', [
            'clinic' => $clinic,
        ]);
    }

    /**
     * Show the form for editing the specified clinic address
     */
    public function edit(int $id): Response
    {
        Gate::authorize('clinics-address.edit');

        $clinic = Clinic::with([
            'governorate:id,name_en,name_ar',
            'area:id,name_en,name_ar',
            'owner:id,name,email',
        ])->findOrFail($id);

        // Get related data for form
        $governorates = \App\Models\Governorate::where('is_active', true)
            ->select('id', 'name_en', 'name_ar', 'is_active')
            ->get();
        $areas = \App\Models\Area::where('is_active', true)
            ->select('id', 'name_en', 'name_ar', 'governorate_id', 'is_active')
            ->get();

        return Inertia::render('dashboard/clinics-address/edit', [
            'clinic' => $clinic,
            'governorates' => $governorates,
            'areas' => $areas,
        ]);
    }

    /**
     * Update the specified clinic address
     */
    public function update(Request $request, int $id)
    {
        Gate::authorize('clinics-address.edit');

        $validated = $request->validate([
            'address' => ['nullable', 'string', 'max:500'],
            'governorate_id' => ['required', 'exists:governorates,id'],
            'area_id' => ['required', 'exists:areas,id'],
            'block' => ['nullable', 'string', 'max:50'],
            'street' => ['nullable', 'string', 'max:100'],
            'avenue' => ['nullable', 'string', 'max:100'],
            'house' => ['nullable', 'string', 'max:50'],
            'floor' => ['nullable', 'string', 'max:50'],
            'apt' => ['nullable', 'string', 'max:50'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100', 'default:Kuwait'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $this->withTransaction(function () use ($id, $validated) {
            return $this->clinicRepository->update($id, $validated);
        });

        return redirect()->route('dashboard.clinics-address.edit', $id)
            ->with('success', __('common.address_updated_successfully'));
    }
}

