<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\TreatmentSlotStoreRequest;
use App\Http\Requests\Dashboard\TreatmentSlotUpdateRequest;
use App\Traits\HandlesRoleBasedQueries;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\TreatmentWeeklySchedule;

class TreatmentWeeklyHoursController extends Controller
{
    use HandlesRoleBasedQueries, ScopesClinicData;

    public function __construct(
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly ClinicRepositoryInterface $clinicRepository
    ) {}

    /**
     * Display a listing of treatment weekly hours (all treatments from all clinics)
     */
    public function index(Request $request): Response
    {
        Gate::authorize('treatment-slots.view'); // Reuse same permission

        $perPage = $request->get('per_page', 15);
        $clinicId = $request->get('clinic_id');
        $search = $request->get('search');
        
        // Get all treatments with their clinic and weekly schedules
        $user = $request->user();
        $treatmentsQuery = \App\Models\Treatment::query()
            ->where('status', 'approved')
            ->with([
                'clinic' => function ($query) {
                    $query->select('id', 'name_en', 'name_ar', 'email', 'phone', 'logo', 'status')
                        ->with(['owner:id,name,email,phone']);
                }
            ])
            ->withCount('weeklySchedules');

        // Apply role-based filtering
        if ($user) {
            if ($user->isSuperAdmin()) {
                // Super admin: show all treatments, no filtering needed
            } elseif ($user->hasRole('clinic') || $user->hasRole('clinic_manager')) {
                // Clinic role: show treatments assigned to their clinic AND all their own treatments
                $accessibleClinicIds = $user->getAccessibleClinicIds();
                if (!empty($accessibleClinicIds)) {
                    $treatmentsQuery->where(function ($q) use ($accessibleClinicIds, $user) {
                        // Treatments assigned to their clinics
                        $q->whereIn('clinic_id', $accessibleClinicIds)
                        // OR treatments created by the user themselves (if there's a creator field)
                        // For now, we'll just filter by clinic_id
                        ;
                    });
                } else {
                    // No accessible clinics, return empty
                    $treatmentsQuery->whereRaw('1 = 0');
                }
            } else {
                // Other roles: return empty
                $treatmentsQuery->whereRaw('1 = 0');
            }
        }

        if ($clinicId) {
            $treatmentsQuery->where('clinic_id', $clinicId);
        }

        if ($search) {
            $treatmentsQuery->where(function($q) use ($search) {
                $q->where('name_en', 'like', "%{$search}%")
                  ->orWhere('name_ar', 'like', "%{$search}%")
                  ->orWhereHas('clinic', function($clinicQuery) use ($search) {
                      $clinicQuery->where('name_en', 'like', "%{$search}%")
                                   ->orWhere('name_ar', 'like', "%{$search}%");
                  });
            });
        }

        $treatments = $treatmentsQuery->paginate($perPage);

        // Transform data to add available days and schedule info
        $treatments->getCollection()->transform(function($treatment) {
            // Get all weekly schedules for this treatment (not filtered by is_open)
            $allSchedules = TreatmentWeeklySchedule::where('clinic_id', $treatment->clinic_id)
                ->where('treatment_id', $treatment->id)
                ->get();
            
            // Get open schedules for available days
            $openSchedules = $allSchedules->where('is_open', true)
                ->sortBy(function($schedule) {
                    $dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    return array_search($schedule->day_of_week, $dayOrder);
                });

            $treatment->available_days = $openSchedules->pluck('day_of_week')->toArray();
            $treatment->has_schedule = $allSchedules->count() > 0;
            $treatment->is_active = $openSchedules->count() > 0;
            
            // Get first schedule for common fields
            $firstSchedule = $allSchedules->first();
            if ($firstSchedule) {
                $treatment->slot_duration = $firstSchedule->slot_duration;
                $treatment->buffer_time_minutes = $firstSchedule->buffer_time_minutes;
                $treatment->max_bookings_per_slot = $firstSchedule->max_bookings_per_slot;
            }
            
            return $treatment;
        });

        $filters = $request->only(['clinic_id', 'search']);
        $filters = array_merge($filters, $request->get('filters', []));

        // Get clinics for filter dropdown based on user role
        $allClinics = $this->getApprovedClinicsForDropdown()
            ->map(function($clinic) {
                return [
                    'id' => $clinic->id,
                    'name_en' => $clinic->name_en ?? '',
                    'name_ar' => $clinic->name_ar ?? '',
                ];
            });

        // Get user role for frontend
        $isSuperAdmin = $user && $user->isSuperAdmin();

        return Inertia::render('dashboard/treatment-weekly-hours/index', [
            'treatments' => $treatments,
            'filters' => $filters,
            'allClinics' => $allClinics,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Show the form for creating a new treatment weekly hours
     */
    public function create(Request $request): Response
    {
        Gate::authorize('treatment-slots.create'); // Reuse same permission

        // Get approved clinics based on user role
        $user = $request->user();
        $clinics = $this->getApprovedClinicsForDropdown()
            ->map(function($clinic) {
                return [
                    'id' => $clinic->id,
                    'name_en' => $clinic->name_en ?? '',
                    'name_ar' => $clinic->name_ar ?? '',
                ];
            });

        $isClinicRole = $user && ($user->hasRole('clinic') || $user->hasRole('clinic_manager'));

        // Get treatments (will be filtered by clinic on frontend)
        $treatments = $this->treatmentRepository->findBy(['status' => 'approved'], 1000)
            ->map(function($treatment) {
                return [
                    'id' => $treatment->id,
                    'clinic_id' => $treatment->clinic_id,
                    'name_en' => $treatment->name_en ?? '',
                    'name_ar' => $treatment->name_ar ?? '',
                ];
            });

        // Get operating hours for all clinics (keyed by clinic_id)
        $allOperatingHours = \App\Models\ClinicOperatingHour::whereIn('clinic_id', $clinics->pluck('id'))
            ->get()
            ->groupBy('clinic_id')
            ->map(function($hours) {
                return $hours->keyBy('day_of_week')->map(function($hour) {
                    return [
                        'day_of_week' => $hour->day_of_week,
                        'is_open' => $hour->is_open,
                        'closed_all_day' => $hour->closed_all_day,
                        'opening_time' => $hour->opening_time ? $hour->opening_time->format('H:i') : null,
                        'closing_time' => $hour->closing_time ? $hour->closing_time->format('H:i') : null,
                    ];
                });
            });

        // Get existing schedules to check for duplicates (keyed by clinic_id-treatment_id)
        $existingSchedules = \App\Models\TreatmentWeeklySchedule::select('clinic_id', 'treatment_id')
            ->distinct()
            ->get()
            ->mapWithKeys(function($schedule) {
                return ["{$schedule->clinic_id}-{$schedule->treatment_id}" => true];
            });

        return Inertia::render('dashboard/treatment-weekly-hours/create', [
            'clinics' => $clinics,
            'treatments' => $treatments,
            'operatingHours' => $allOperatingHours,
            'isClinicRole' => $isClinicRole,
            'existingSchedules' => $existingSchedules,
        ]);
    }

    /**
     * Store a newly created treatment weekly schedule
     */
    public function store(TreatmentSlotStoreRequest $request)
    {
        Gate::authorize('treatment-slots.create');

        $user = $request->user();
        $isClinicRole = $user && ($user->hasRole('clinic') || $user->hasRole('clinic_manager'));

        // For clinic role, validate that clinic_id is from their accessible clinics
        if ($isClinicRole && $request->has('clinic_id')) {
            $accessibleClinicIds = $user->getAccessibleClinicIds();
            if (!in_array((int)$request->input('clinic_id'), $accessibleClinicIds)) {
                return back()->withErrors(['clinic_id' => __('common.clinic_not_accessible')])->withInput();
            }
        }

        $validated = $request->validated();

        $this->withTransaction(function () use ($validated) {
            // Delete existing weekly schedules for this clinic-treatment combination
            TreatmentWeeklySchedule::where('clinic_id', $validated['clinic_id'])
                ->where('treatment_id', $validated['treatment_id'])
                ->delete();

            // Create new weekly schedules
            if (!empty($validated['weekly_schedule']) && is_array($validated['weekly_schedule'])) {
                $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                
                foreach ($validated['weekly_schedule'] as $daySchedule) {
                    if (isset($daySchedule['day_of_week']) && in_array($daySchedule['day_of_week'], $validDays)) {
                        // Create schedule for both open and closed days to persist the state
                        $isOpen = !empty($daySchedule['is_open']);
                        
                        // If day is open, require opening_time and closing_time
                        if ($isOpen && (!empty($daySchedule['opening_time']) && !empty($daySchedule['closing_time']))) {
                            TreatmentWeeklySchedule::create([
                                'clinic_id' => $validated['clinic_id'],
                                'treatment_id' => $validated['treatment_id'],
                                'day_of_week' => $daySchedule['day_of_week'],
                                'is_open' => true,
                                'closed_all_day' => false,
                                'opening_time' => $daySchedule['opening_time'],
                                'closing_time' => $daySchedule['closing_time'],
                                'slot_duration' => !empty($validated['slot_duration']) ? (int)$validated['slot_duration'] : null,
                                'buffer_time_minutes' => !empty($validated['buffer_time_minutes']) ? (int)$validated['buffer_time_minutes'] : null,
                                'max_bookings_per_slot' => !empty($validated['max_bookings_per_slot']) ? (int)$validated['max_bookings_per_slot'] : null,
                                'notes_en' => !empty($daySchedule['notes_en']) ? $daySchedule['notes_en'] : (!empty($validated['notes_en']) ? $validated['notes_en'] : null),
                                'notes_ar' => !empty($daySchedule['notes_ar']) ? $daySchedule['notes_ar'] : (!empty($validated['notes_ar']) ? $validated['notes_ar'] : null),
                            ]);
                        } elseif (!$isOpen) {
                            // Create schedule for closed days to persist the closed state
                            TreatmentWeeklySchedule::create([
                                'clinic_id' => $validated['clinic_id'],
                                'treatment_id' => $validated['treatment_id'],
                                'day_of_week' => $daySchedule['day_of_week'],
                                'is_open' => false,
                                'closed_all_day' => !empty($daySchedule['closed_all_day']) ? true : false,
                                'opening_time' => null,
                                'closing_time' => null,
                                'slot_duration' => !empty($validated['slot_duration']) ? (int)$validated['slot_duration'] : null,
                                'buffer_time_minutes' => !empty($validated['buffer_time_minutes']) ? (int)$validated['buffer_time_minutes'] : null,
                                'max_bookings_per_slot' => !empty($validated['max_bookings_per_slot']) ? (int)$validated['max_bookings_per_slot'] : null,
                                'notes_en' => !empty($daySchedule['notes_en']) ? $daySchedule['notes_en'] : (!empty($validated['notes_en']) ? $validated['notes_en'] : null),
                                'notes_ar' => !empty($daySchedule['notes_ar']) ? $daySchedule['notes_ar'] : (!empty($validated['notes_ar']) ? $validated['notes_ar'] : null),
                            ]);
                        }
                    }
                }
            }
        });

        return redirect()->route('dashboard.treatment-weekly-hours.index')
            ->with('success', __('common.treatment_weekly_schedule_created_successfully'));
    }

    /**
     * Show the form for editing the specified treatment weekly schedule
     */
    public function edit(int $clinicId, int $treatmentId, Request $request): Response
    {
        Gate::authorize('treatment-slots.edit');

        $clinic = $this->clinicRepository->findOrFail($clinicId);
        $treatment = $this->treatmentRepository->findOrFail($treatmentId);
        
        // Get existing weekly schedules
        $schedules = TreatmentWeeklySchedule::where('clinic_id', $clinicId)
            ->where('treatment_id', $treatmentId)
            ->get();
        
        $weeklySchedules = $schedules->keyBy('day_of_week')
            ->map(function($schedule) {
                // Format times to H:i format for frontend compatibility
                $openingTime = $schedule->opening_time;
                $closingTime = $schedule->closing_time;
                
                // Format opening_time
                if ($openingTime) {
                    if ($openingTime instanceof \Carbon\Carbon || $openingTime instanceof \DateTime) {
                        $openingTime = $openingTime->format('H:i');
                    } elseif (is_string($openingTime)) {
                        // If it's a string like "09:00:00", extract just "09:00"
                        if (strlen($openingTime) > 5) {
                            $openingTime = substr($openingTime, 0, 5);
                        }
                    }
                } else {
                    $openingTime = null;
                }
                
                // Format closing_time
                if ($closingTime) {
                    if ($closingTime instanceof \Carbon\Carbon || $closingTime instanceof \DateTime) {
                        $closingTime = $closingTime->format('H:i');
                    } elseif (is_string($closingTime)) {
                        // If it's a string like "17:00:00", extract just "17:00"
                        if (strlen($closingTime) > 5) {
                            $closingTime = substr($closingTime, 0, 5);
                        }
                    }
                } else {
                    $closingTime = null;
                }
                
                return [
                    'id' => $schedule->id,
                    'day_of_week' => $schedule->day_of_week,
                    'is_open' => $schedule->is_open,
                    'closed_all_day' => $schedule->closed_all_day,
                    'opening_time' => $openingTime,
                    'closing_time' => $closingTime,
                    'slot_duration' => $schedule->slot_duration,
                    'buffer_time_minutes' => $schedule->buffer_time_minutes,
                    'max_bookings_per_slot' => $schedule->max_bookings_per_slot,
                    'notes_en' => $schedule->notes_en,
                    'notes_ar' => $schedule->notes_ar,
                ];
            });

        // Get common fields from first schedule (if exists)
        $firstSchedule = $schedules->first();
        $commonFields = [
            'slot_duration' => $firstSchedule?->slot_duration,
            'buffer_time_minutes' => $firstSchedule?->buffer_time_minutes,
            'max_bookings_per_slot' => $firstSchedule?->max_bookings_per_slot,
            'notes_en' => $firstSchedule?->notes_en,
            'notes_ar' => $firstSchedule?->notes_ar,
        ];

        // Get approved clinics based on user role
        $user = $request->user();
        $clinics = $this->getApprovedClinicsForDropdown()
            ->map(function($c) {
                return [
                    'id' => $c->id,
                    'name_en' => $c->name_en ?? '',
                    'name_ar' => $c->name_ar ?? '',
                ];
            });

        $isClinicRole = $user && ($user->hasRole('clinic') || $user->hasRole('clinic_manager'));

        // Get treatments for the clinic
        $treatments = $this->treatmentRepository->findBy([
            'clinic_id' => $clinicId,
            'status' => 'approved'
        ], 1000)
            ->map(function($t) {
                return [
                    'id' => $t->id,
                    'clinic_id' => $t->clinic_id,
                    'name_en' => $t->name_en ?? '',
                    'name_ar' => $t->name_ar ?? '',
                ];
            });

        // Get operating hours for the clinic
        $clinicOperatingHours = \App\Models\ClinicOperatingHour::where('clinic_id', $clinicId)
            ->get()
            ->keyBy('day_of_week')
            ->map(function($hour) {
                return [
                    'day_of_week' => $hour->day_of_week,
                    'is_open' => $hour->is_open,
                    'closed_all_day' => $hour->closed_all_day,
                    'opening_time' => $hour->opening_time ? $hour->opening_time->format('H:i') : null,
                    'closing_time' => $hour->closing_time ? $hour->closing_time->format('H:i') : null,
                ];
            });

        return Inertia::render('dashboard/treatment-weekly-hours/edit', [
            'clinic' => [
                'id' => $clinic->id,
                'name_en' => $clinic->name_en,
                'name_ar' => $clinic->name_ar,
            ],
            'treatment' => [
                'id' => $treatment->id,
                'clinic_id' => $treatment->clinic_id,
                'name_en' => $treatment->name_en,
                'name_ar' => $treatment->name_ar,
            ],
            'weeklySchedules' => $weeklySchedules,
            'commonFields' => $commonFields,
            'clinics' => $clinics,
            'treatments' => $treatments,
            'operatingHours' => $clinicOperatingHours,
            'isClinicRole' => $isClinicRole,
        ]);
    }

    /**
     * Update the specified treatment weekly schedule
     */
    public function update(TreatmentSlotUpdateRequest $request, int $clinicId, int $treatmentId)
    {
        Gate::authorize('treatment-slots.edit');

        $user = $request->user();
        $isClinicRole = $user && ($user->hasRole('clinic') || $user->hasRole('clinic_manager'));

        // For clinic role, validate that they can access this clinic
        if ($isClinicRole) {
            $accessibleClinicIds = $user->getAccessibleClinicIds();
            if (!in_array($clinicId, $accessibleClinicIds)) {
                return back()->withErrors(['clinic_id' => __('common.clinic_not_accessible')])->withInput();
            }
        }

        $validated = $request->validated();

        $this->withTransaction(function () use ($validated, $clinicId, $treatmentId, $request) {
            // Get new clinic_id from request if provided, otherwise use route parameter
            $newClinicId = $request->has('clinic_id') ? (int)$request->input('clinic_id') : $clinicId;
            $newTreatmentId = $request->has('treatment_id') ? (int)$request->input('treatment_id') : $treatmentId;
            
            // If clinic or treatment changed, delete old schedules
            if ($newClinicId !== $clinicId || $newTreatmentId !== $treatmentId) {
                TreatmentWeeklySchedule::where('clinic_id', $clinicId)
                    ->where('treatment_id', $treatmentId)
                    ->delete();
            } else {
                // Delete existing weekly schedules for this clinic-treatment combination
                TreatmentWeeklySchedule::where('clinic_id', $clinicId)
                    ->where('treatment_id', $treatmentId)
                    ->delete();
            }

            // Create new weekly schedules
            if (!empty($validated['weekly_schedule']) && is_array($validated['weekly_schedule'])) {
                $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                
                foreach ($validated['weekly_schedule'] as $daySchedule) {
                    if (isset($daySchedule['day_of_week']) && in_array($daySchedule['day_of_week'], $validDays)) {
                        // Create schedule for both open and closed days to persist the state
                        $isOpen = !empty($daySchedule['is_open']);
                        
                        // If day is open, require opening_time and closing_time
                        if ($isOpen && (!empty($daySchedule['opening_time']) && !empty($daySchedule['closing_time']))) {
                            TreatmentWeeklySchedule::create([
                                'clinic_id' => $newClinicId,
                                'treatment_id' => $newTreatmentId,
                                'day_of_week' => $daySchedule['day_of_week'],
                                'is_open' => true,
                                'closed_all_day' => false,
                                'opening_time' => $daySchedule['opening_time'],
                                'closing_time' => $daySchedule['closing_time'],
                                'slot_duration' => !empty($validated['slot_duration']) ? (int)$validated['slot_duration'] : null,
                                'buffer_time_minutes' => !empty($validated['buffer_time_minutes']) ? (int)$validated['buffer_time_minutes'] : null,
                                'max_bookings_per_slot' => !empty($validated['max_bookings_per_slot']) ? (int)$validated['max_bookings_per_slot'] : null,
                                'notes_en' => !empty($daySchedule['notes_en']) ? $daySchedule['notes_en'] : (!empty($validated['notes_en']) ? $validated['notes_en'] : null),
                                'notes_ar' => !empty($daySchedule['notes_ar']) ? $daySchedule['notes_ar'] : (!empty($validated['notes_ar']) ? $validated['notes_ar'] : null),
                            ]);
                        } elseif (!$isOpen) {
                            // Create schedule for closed days to persist the closed state
                            TreatmentWeeklySchedule::create([
                                'clinic_id' => $newClinicId,
                                'treatment_id' => $newTreatmentId,
                                'day_of_week' => $daySchedule['day_of_week'],
                                'is_open' => false,
                                'closed_all_day' => !empty($daySchedule['closed_all_day']) ? true : false,
                                'opening_time' => null,
                                'closing_time' => null,
                                'slot_duration' => !empty($validated['slot_duration']) ? (int)$validated['slot_duration'] : null,
                                'buffer_time_minutes' => !empty($validated['buffer_time_minutes']) ? (int)$validated['buffer_time_minutes'] : null,
                                'max_bookings_per_slot' => !empty($validated['max_bookings_per_slot']) ? (int)$validated['max_bookings_per_slot'] : null,
                                'notes_en' => !empty($daySchedule['notes_en']) ? $daySchedule['notes_en'] : (!empty($validated['notes_en']) ? $validated['notes_en'] : null),
                                'notes_ar' => !empty($daySchedule['notes_ar']) ? $daySchedule['notes_ar'] : (!empty($validated['notes_ar']) ? $validated['notes_ar'] : null),
                            ]);
                        }
                    }
                }
            }
        });

        // Use new clinic_id and treatment_id if they changed
        $finalClinicId = $request->has('clinic_id') ? (int)$request->input('clinic_id') : $clinicId;
        $finalTreatmentId = $request->has('treatment_id') ? (int)$request->input('treatment_id') : $treatmentId;
        
        return redirect()->route('dashboard.treatment-weekly-hours.edit', ['clinic' => $finalClinicId, 'treatment' => $finalTreatmentId])
            ->with('success', __('common.treatment_weekly_schedule_updated_successfully'));
    }

    /**
     * Remove the specified treatment weekly schedule from storage
     */
    public function destroy(int $clinicId, int $treatmentId)
    {
        Gate::authorize('treatment-slots.destroy');

        $this->withTransaction(function () use ($clinicId, $treatmentId) {
            TreatmentWeeklySchedule::where('clinic_id', $clinicId)
                ->where('treatment_id', $treatmentId)
                ->delete();
        });

        return redirect()->route('dashboard.treatment-weekly-hours.index')
            ->with('success', __('common.treatment_weekly_schedule_deleted_successfully'));
    }

    /**
     * Toggle active/inactive status for a treatment weekly schedule
     */
    public function toggleStatus(int $clinicId, int $treatmentId)
    {
        Gate::authorize('treatment-slots.edit');

        $schedules = TreatmentWeeklySchedule::where('clinic_id', $clinicId)
            ->where('treatment_id', $treatmentId)
            ->get();

        if ($schedules->isEmpty()) {
            return back()->with('error', __('common.no_schedules_found'));
        }

        // Toggle is_open for all schedules
        $isCurrentlyActive = $schedules->where('is_open', true)->count() > 0;
        $newStatus = !$isCurrentlyActive;

        $this->withTransaction(function () use ($clinicId, $treatmentId, $newStatus) {
            TreatmentWeeklySchedule::where('clinic_id', $clinicId)
                ->where('treatment_id', $treatmentId)
                ->update(['is_open' => $newStatus]);
        });

        return back()->with('success', $newStatus 
            ? __('common.treatment_schedule_activated') 
            : __('common.treatment_schedule_deactivated'));
    }
}
