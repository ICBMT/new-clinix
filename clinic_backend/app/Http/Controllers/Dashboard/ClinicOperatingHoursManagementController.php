<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\ClinicOperatingHourRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClinicOperatingHoursManagementController extends Controller
{
    public function __construct(
        private readonly ClinicRepositoryInterface $clinicRepository,
        private readonly ClinicOperatingHourRepositoryInterface $operatingHourRepository
    ) {}

    /**
     * Display a listing of all clinic operating hours
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics-operating-hours.view');

        $perPage = $request->get('per_page', 15);
        
        // Get filters from nested array or root level
        $filters = $request->input('filters', []);
        $clinicId = $filters['clinic_id'] ?? $request->input('clinic_id');
        $dayOfWeek = $filters['day_of_week'] ?? $request->input('day_of_week');
        $search = $request->input('search');

        // Get operating hours with clinic information - include all clinics, not just approved
        $query = \App\Models\ClinicOperatingHour::with([
            'clinic:id,name_en,name_ar,status',
        ]);

        // Apply filters
        if ($clinicId) {
            $query->where('clinic_id', $clinicId);
        }

        if ($dayOfWeek) {
            $query->where('day_of_week', $dayOfWeek);
        }

        if ($search) {
            $query->whereHas('clinic', function($q) use ($search) {
                $q->where('name_en', 'like', '%' . $search . '%')
                  ->orWhere('name_ar', 'like', '%' . $search . '%');
            });
        }

        $operatingHours = $query->orderBy('clinic_id')->orderBy('day_of_week')->paginate($perPage);

        // Transform operating hours to include is_closed for frontend
        $operatingHours->getCollection()->transform(function ($hour) {
            $hour->is_closed = !$hour->is_open || $hour->closed_all_day;
            return $hour;
        });

        // Get all clinics (not just active) for filter dropdown
        $clinics = \App\Models\Clinic::select('id', 'name_en', 'name_ar')
            ->orderBy('name_en')
            ->get();

        return Inertia::render('dashboard/clinics-operating-hours/index', [
            'operatingHours' => $operatingHours,
            'filters' => [
                'clinic_id' => $clinicId,
                'day_of_week' => $dayOfWeek,
                'search' => $search,
            ],
            'clinics' => $clinics,
        ]);
    }

    /**
     * Display the specified clinic operating hours
     */
    public function show(int $id): Response
    {
        Gate::authorize('clinics-operating-hours.show');

        $operatingHour = \App\Models\ClinicOperatingHour::with([
            'clinic:id,name_en,name_ar,owner_id',
        ])->findOrFail($id);

        // Add is_closed for frontend compatibility
        $operatingHour->is_closed = !$operatingHour->is_open || $operatingHour->closed_all_day;

        return Inertia::render('dashboard/clinics-operating-hours/show', [
            'operatingHour' => $operatingHour,
        ]);
    }

    /**
     * Show the form for editing the specified clinic operating hours
     */
    public function edit(int $id): Response
    {
        Gate::authorize('clinics-operating-hours.edit');

        $operatingHour = \App\Models\ClinicOperatingHour::with([
            'clinic:id,name_en,name_ar',
        ])->findOrFail($id);

        // Add is_closed for frontend compatibility
        $operatingHour->is_closed = !$operatingHour->is_open || $operatingHour->closed_all_day;

        return Inertia::render('dashboard/clinics-operating-hours/edit', [
            'operatingHour' => $operatingHour,
        ]);
    }

    /**
     * Update the specified clinic operating hours
     */
    public function update(Request $request, int $id)
    {
        Gate::authorize('clinics-operating-hours.edit');

        $validated = $request->validate([
            'is_open' => ['required', 'boolean'],
            'opening_time' => ['nullable', 'date_format:H:i', 'required_if:is_open,true'],
            'closing_time' => ['nullable', 'date_format:H:i', 'required_if:is_open,true', 'after:opening_time'],
            'break_start' => ['nullable', 'date_format:H:i'],
            'break_end' => ['nullable', 'date_format:H:i', 'after:break_start'],
        ]);

        // Calculate closed_all_day based on is_open
        $validated['closed_all_day'] = !$validated['is_open'];
        
        // If closed, clear times
        if (!$validated['is_open']) {
            $validated['opening_time'] = null;
            $validated['closing_time'] = null;
        }

        $this->withTransaction(function () use ($id, $validated) {
            return $this->operatingHourRepository->update($id, $validated);
        });

        return redirect()->route('dashboard.clinics-operating-hours.edit', $id)
            ->with('success', __('common.operating_hours_updated_successfully'));
    }
}

