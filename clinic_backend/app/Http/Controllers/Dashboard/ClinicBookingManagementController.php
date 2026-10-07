<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\BookingRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClinicBookingManagementController extends Controller
{
    use ScopesClinicData;
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly ClinicRepositoryInterface $clinicRepository
    ) {}

    /**
     * Display a listing of all clinic bookings
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clinics-bookings.view');

        $perPage = $request->get('per_page', 15);
        
        // Get filters from request (can be in filters array or top level)
        $requestFilters = $request->get('filters', []);
        $filters = [
            'clinic_id' => $requestFilters['clinic_id'] ?? $request->get('clinic_id'),
            'status' => $requestFilters['status'] ?? $request->get('status'),
            'date_from' => $requestFilters['date_from'] ?? $request->get('date_from'),
            'date_to' => $requestFilters['date_to'] ?? $request->get('date_to'),
            'search' => $request->get('search'),
        ];

        // Get bookings with clinic filter
        $query = Booking::with([
            'clinic:id,name_en,name_ar',
            'user:id,name,email,phone',
            'treatment:id,name_en,name_ar',
            'machine:id,serial_number',
        ]);

        // Scope by accessible clinics
        $accessibleClinicIds = $this->getAccessibleClinicIds();
        if (!empty($accessibleClinicIds)) {
            $query->whereIn('clinic_id', $accessibleClinicIds);
        } else {
            // If no accessible clinics, return empty result
            $query->whereRaw('1 = 0');
        }

        // Apply filters
        if (!empty($filters['clinic_id'])) {
            // Ensure the requested clinic is accessible
            if (in_array($filters['clinic_id'], $accessibleClinicIds)) {
                $query->where('clinic_id', $filters['clinic_id']);
            }
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('booking_reference', 'like', '%' . $filters['search'] . '%')
                  ->orWhereHas('user', function($userQuery) use ($filters) {
                      $userQuery->where('name', 'like', '%' . $filters['search'] . '%')
                                ->orWhere('email', 'like', '%' . $filters['search'] . '%');
                  });
            });
        }

        $bookings = $query->latest()->paginate($perPage);

        // Get clinics for filter dropdown (only accessible ones)
        $clinicsQuery = \App\Models\Clinic::query();
        $clinicsQuery = $this->scopeClinicsForUser($clinicsQuery);
        $clinics = $clinicsQuery->select('id', 'name_en', 'name_ar')->get();

        return Inertia::render('dashboard/clinics-bookings/index', [
            'bookings' => $bookings,
            'filters' => $filters,
            'clinics' => $clinics,
        ]);
    }

    /**
     * Display the specified clinic booking
     */
    public function show(int $id): Response
    {
        Gate::authorize('clinics-bookings.show');

        $booking = Booking::with([
            'clinic' => function($q) {
                $q->select([
                    'id', 'name_en', 'name_ar', 'address', 'governorate_id', 'area_id', 
                    'block', 'street', 'avenue', 'house', 'floor', 'apt', 'city', 
                    'state', 'country', 'postal_code', 'latitude', 'longitude',
                    'cancellation_policy_en', 'cancellation_policy_ar',
                    'refund_policy_en', 'refund_policy_ar',
                    'rescheduling_policy_en', 'rescheduling_policy_ar',
                ])->with([
                    'governorate:id,name_en,name_ar',
                    'area:id,name_en,name_ar',
                ]);
            },
            'user:id,name,email,phone',
            'treatment:id,name_en,name_ar',
            'machine:id,serial_number',
            'sessions',
            'media'
        ])->findOrFail($id);

        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        return Inertia::render('dashboard/clinics-bookings/show', [
            'booking' => $booking,
        ]);
    }

    /**
     * Update the specified clinic booking
     */
    public function update(Request $request, int $id)
    {
        Gate::authorize('clinics-bookings.edit');

        $booking = Booking::findOrFail($id);
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled,completed'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->withTransaction(function () use ($id, $validated) {
            return $this->bookingRepository->update($id, $validated);
        });

        return redirect()->route('dashboard.clinics-bookings.show', $id)
            ->with('success', __('common.booking_updated_successfully'));
    }

    /**
     * Reschedule a clinic booking
     */
    public function reschedule(Request $request, int $id)
    {
        Gate::authorize('clinics-bookings.reschedule');

        $booking = Booking::findOrFail($id);
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        $validated = $request->validate([
            'new_date' => ['required', 'date', 'after:today'],
            'new_time' => ['required', 'date_format:H:i'],
        ]);

        $this->withTransaction(function () use ($id, $validated) {
            return $this->bookingRepository->reschedule($id, $validated['new_date'], $validated['new_time']);
        });

        return redirect()->route('dashboard.clinics-bookings.show', $id)
            ->with('success', __('common.booking_rescheduled_successfully'));
    }

    /**
     * Cancel a clinic booking
     */
    public function cancel(Request $request, int $id)
    {
        Gate::authorize('clinics-bookings.cancel');

        $booking = Booking::findOrFail($id);
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        $validated = $request->validate([
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->withTransaction(function () use ($id, $validated) {
            return $this->bookingRepository->cancel($id, $validated['cancellation_reason'] ?? null);
        });

        return redirect()->route('dashboard.clinics-bookings.show', $id)
            ->with('success', __('common.booking_cancelled_successfully'));
    }

    /**
     * Complete a clinic booking
     */
    public function complete(Request $request, int $id)
    {
        Gate::authorize('clinics-bookings.complete');

        $booking = Booking::findOrFail($id);
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        $this->withTransaction(function () use ($id) {
            return $this->bookingRepository->complete($id);
        });

        return redirect()->route('dashboard.clinics-bookings.show', $id)
            ->with('success', __('common.booking_completed_successfully'));
    }

    /**
     * Accept a clinic booking
     */
    public function accept(Request $request, int $id)
    {
        Gate::authorize('clinics-bookings.accept');

        $booking = Booking::findOrFail($id);
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        $this->withTransaction(function () use ($id) {
            return $this->bookingRepository->confirm($id);
        });

        return redirect()->route('dashboard.clinics-bookings.show', $id)
            ->with('success', __('common.booking_accepted_successfully'));
    }

    /**
     * Reject a clinic booking
     */
    public function reject(Request $request, int $id)
    {
        Gate::authorize('clinics-bookings.reject');

        $booking = Booking::findOrFail($id);
        
        // Check if user can access this clinic
        if (!$this->canAccessClinic($booking->clinic_id)) {
            abort(403, __('common.no_access_to_booking'));
        }

        $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $booking = Booking::findOrFail($id);
            $booking->update([
                'status' => 'cancelled',
                'rejection_reason' => $request->input('rejection_reason'),
                'rejected_at' => now(),
            ]);
        });

        return redirect()->route('dashboard.clinics-bookings.show', $id)
            ->with('success', __('common.booking_rejected_successfully'));
    }
}

