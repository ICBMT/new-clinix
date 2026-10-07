<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\TreatmentSlotRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\TreatmentSlotStoreRequest;
use App\Http\Requests\Dashboard\TreatmentSlotUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\TreatmentWeeklySchedule;

class TreatmentSlotManagementController extends Controller
{
    public function __construct(
        private readonly TreatmentSlotRepositoryInterface $treatmentSlotRepository,
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly ClinicRepositoryInterface $clinicRepository
    ) {}

    /**
     * Display a listing of treatment slots
     */
    public function index(Request $request): Response
    {
        Gate::authorize('treatment-slots.view');

        $perPage = $request->get('per_page', 15);
        $treatmentSlots = $this->treatmentSlotRepository->paginate($request, $perPage);

        // Ensure treatment relationship is loaded for all items
        $treatmentSlots->getCollection()->load('treatment:id,name_en,name_ar');

        $filters = $request->only(['search']);
        $filters = array_merge($filters, $request->get('filters', []));

        return Inertia::render('dashboard/treatment-slots/index', [
            'treatmentSlots' => $treatmentSlots,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new treatment slot
     */
    public function create(Request $request): Response
    {
        Gate::authorize('treatment-slots.create');

        // Get treatments for dropdown
        $treatments = $this->treatmentRepository->paginate($request, 100);

        return Inertia::render('dashboard/treatment-slots/create', [
            'treatments' => $treatments->items(),
        ]);
    }

    /**
     * Store a newly created treatment slot in storage
     */
    public function store(TreatmentSlotStoreRequest $request)
    {
        Gate::authorize('treatment-slots.create');

        $validated = $request->validated();
        $createdCount = 0;

        $this->withTransaction(function () use ($request, $validated, &$createdCount) {
            // Check if weekly schedule is provided
            if (!empty($validated['weekly_schedule']) && is_array($validated['weekly_schedule'])) {
                // Weekly schedule mode - generate slots based on weekly pattern
                $startDate = \Carbon\Carbon::parse($validated['start_date']);
                $endDate = \Carbon\Carbon::parse($validated['end_date']);
                $weeklySchedule = $validated['weekly_schedule'];
                
                $baseSlotData = [
                    'treatment_id' => $validated['treatment_id'],
                    'buffer_time_minutes' => $validated['buffer_time_minutes'] ?? null,
                    'max_bookings_per_slot' => $validated['max_bookings_per_slot'] ?? null,
                    'slot_duration' => $validated['slot_duration'] ?? null,
                    'status' => $validated['status'],
                    'price' => $validated['price'] ?? null,
                    'notes_en' => $validated['notes_en'] ?? null,
                    'notes_ar' => $validated['notes_ar'] ?? null,
                ];

                // Create slots for each date in the range that matches enabled days
                $currentDate = $startDate->copy();
                while ($currentDate->lte($endDate)) {
                    // Get day name in lowercase (monday, tuesday, etc.)
                    $dayName = strtolower($currentDate->format('l')); // 'monday', 'tuesday', etc.
                    $daySchedule = $weeklySchedule[$dayName] ?? null;
                    
                    // Only create slot if this day is enabled in the weekly schedule
                    if ($daySchedule && !empty($daySchedule['enabled']) && $daySchedule['enabled']) {
                        $slotData = array_merge($baseSlotData, [
                            'slot_date' => $currentDate->format('Y-m-d'),
                            'start_time' => $daySchedule['start_time'],
                            'end_time' => $daySchedule['end_time'],
                        ]);
                        
                        $this->treatmentSlotRepository->create($slotData);
                        $createdCount++;
                    }
                    
                    $currentDate->addDay();
                }
            } elseif (!empty($validated['start_date']) && !empty($validated['end_date'])) {
                // Simple date range mode (without weekly schedule)
                $startDate = \Carbon\Carbon::parse($validated['start_date']);
                $endDate = \Carbon\Carbon::parse($validated['end_date']);
                
                $slotData = [
                    'treatment_id' => $validated['treatment_id'],
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'buffer_time_minutes' => $validated['buffer_time_minutes'] ?? null,
                    'max_bookings_per_slot' => $validated['max_bookings_per_slot'] ?? null,
                    'slot_duration' => $validated['slot_duration'] ?? null,
                    'status' => $validated['status'],
                    'price' => $validated['price'] ?? null,
                    'notes_en' => $validated['notes_en'] ?? null,
                    'notes_ar' => $validated['notes_ar'] ?? null,
                ];

                // Create a slot for each date in the range
                $currentDate = $startDate->copy();
                while ($currentDate->lte($endDate)) {
                    $slotData['slot_date'] = $currentDate->format('Y-m-d');
                    $this->treatmentSlotRepository->create($slotData);
                    $createdCount++;
                    $currentDate->addDay();
                }
            } else {
                // Single date slot (original behavior)
                $this->treatmentSlotRepository->create($validated);
                $createdCount = 1;
            }
        });

        $message = $createdCount > 1 
            ? __('common.treatment_slots_created_successfully', ['count' => $createdCount])
            : __('common.treatment_slot_created_successfully');

        return redirect()->route('dashboard.treatment-slots.index')
            ->with('success', $message);
    }


    /**
     * Show the form for editing the specified treatment slot
     */
    public function edit(int $id, Request $request): Response
    {
        Gate::authorize('treatment-slots.edit');

        $treatmentSlot = $this->treatmentSlotRepository->findOrFail($id);
        $treatments = $this->treatmentRepository->paginate($request, 100);

        return Inertia::render('dashboard/treatment-slots/edit', [
            'treatmentSlot' => $treatmentSlot,
            'treatments' => $treatments->items(),
        ]);
    }

    /**
     * Update the specified treatment slot in storage
     */
    public function update(TreatmentSlotUpdateRequest $request, int $id)
    {
        Gate::authorize('treatment-slots.edit');

        $this->withTransaction(function () use ($request, $id) {
            return $this->treatmentSlotRepository->update($id, $request->validated());
        });

        return redirect()->route('dashboard.treatment-slots.edit', $id)
            ->with('success', __('common.treatment_slot_updated_successfully'));
    }

    /**
     * Remove the specified treatment slot from storage
     */
    public function destroy(int $id)
    {
        Gate::authorize('treatment-slots.destroy');

        $this->withTransaction(function () use ($id) {
            $this->treatmentSlotRepository->delete($id);
        });

        return redirect()->route('dashboard.treatment-slots.index')
            ->with('success', __('common.treatment_slot_deleted_successfully'));
    }

}

