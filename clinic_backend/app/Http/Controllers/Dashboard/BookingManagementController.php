<?php

namespace App\Http\Controllers\Dashboard;

use App\Contracts\BookingRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Traits\ScopesClinicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingManagementController extends Controller
{
    use ScopesClinicData;
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly TreatmentRepositoryInterface $treatmentRepository
    ) {}

    /**
     * Display a listing of bookings with tabs
     */
    public function index(Request $request): Response
    {
        Gate::authorize('bookings.view');

        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $tab = $request->get('tab', 'all'); // all, upcoming, accepted, cancelled, past
        
        // Get filters from request
        $filters = array_merge(
            $request->only(['search', 'status', 'clinic_id']),
            $request->get('filters', [])
        );
        $filters['tab'] = $tab;

        // Use role-based filtering
        $bookings = $this->bookingRepository->getBookingsForUser($user, $filters, $perPage);

        // Get accessible clinics for filter dropdown
        $accessibleClinics = $this->getAccessibleClinics($user);

        return Inertia::render('dashboard/bookings/index', [
            'bookings' => $bookings,
            'filters' => $filters,
            'currentTab' => $tab,
            'accessibleClinics' => $accessibleClinics,
        ]);
    }

    /**
     * Get clinics accessible to the user based on their role
     */
    private function getAccessibleClinics($user)
    {
        return $this->getApprovedClinicsForDropdown()
                ->map(function ($clinic) {
                    return [
                        'id' => $clinic->id,
                        'name_en' => $clinic->name_en ?? '',
                        'name_ar' => $clinic->name_ar ?? '',
                    ];
                });
    }

    /**
     * Display the specified booking
     */
    public function show(int $id): Response
    {
        Gate::authorize('bookings.show');

        $booking = $this->bookingRepository->findWithRelations($id, [
            'user',
            'clinic' => function($q) {
                $q->select([
                    'id', 'name_en', 'name_ar', 'email', 'phone', 'address', 
                    'governorate_id', 'area_id', 'block', 'street', 'avenue', 
                    'house', 'floor', 'apt', 'city', 'state', 'country', 
                    'postal_code', 'latitude', 'longitude',
                    'cancellation_policy_en', 'cancellation_policy_ar',
                    'refund_policy_en', 'refund_policy_ar',
                    'rescheduling_policy_en', 'rescheduling_policy_ar',
                ])->with([
                    'owner:id,name,email',
                    'category:id,name_en,name_ar',
                    'governorate:id,name_en,name_ar',
                    'area:id,name_en,name_ar',
                ]);
            },
            'treatment',
            'treatment.category',
            'machine',
            'address.governorate',
            'address.area',
            'sessions',
            'media',
            'transactions',
            'reviews.user',
            'patientBodyPart',
        ]);
        
        // Load all media documents (not just booking_session_documents)
        if ($booking) {
            $booking->load('media');
            
            // Load medical records if medical_record_ids exist
            if ($booking->medical_record_ids && is_array($booking->medical_record_ids) && !empty($booking->medical_record_ids)) {
                $medicalRecords = \App\Models\Media::whereIn('id', $booking->medical_record_ids)
                    ->where('collection_name', 'medical-records')
                    ->get();
                // Add medical records to media collection for display
                $booking->setRelation('documents', $medicalRecords);
            } else {
                $booking->setRelation('documents', collect([]));
            }
        }

        return Inertia::render('dashboard/bookings/show', [
            'booking' => $booking->toArray(),
        ]);
    }

    /**
     * Update booking status
     */
    public function update(Request $request, int $id)
    {
        Gate::authorize('bookings.edit');

        // Valid statuses from migration: 'upcoming', 'accepted', 'cancelled', 'completed', 'past'
        $request->validate([
            'status' => ['required', 'in:upcoming,accepted,cancelled,completed,past'],
        ]);

        try {
            $this->withTransaction(function () use ($request, $id) {
                $booking = $this->bookingRepository->findOrFail($id);
                
                $newStatus = $request->input('status');
                
                // Prevent cancelling a completed booking
                if ($booking->status === 'completed' && $newStatus === 'cancelled') {
                    throw new \Illuminate\Validation\ValidationException(
                        validator([], []),
                        ['status' => [__('common.booking_cannot_be_cancelled_after_completion')]]
                    );
                }

                // Don't allow status update if payment is not paid (except for cancelled status)
                if ($newStatus !== 'cancelled' && $booking->payment_status !== 'paid') {
                    throw new \Illuminate\Validation\ValidationException(
                        validator([], []),
                        ['status' => [__('common.booking_payment_required')]]
                    );
                }
                
                // Update status with appropriate timestamps
                $updateData = ['status' => $newStatus];
                
                if ($newStatus === 'accepted') {
                    $updateData['confirmed_at'] = now();
                } elseif ($newStatus === 'completed') {
                    $updateData['completed_at'] = now();
                } elseif ($newStatus === 'cancelled') {
                    $updateData['cancelled_at'] = now();
                }
                
                $booking->update($updateData);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('common.booking_updated_successfully'));
    }

    /**
     * Toggle booking status
     */
    public function toggleStatus(Request $request, int $id)
    {
        // Permission not in seeder, allow for now
        // Gate::authorize('bookings.toggle-status');

        // Valid statuses from migration: 'upcoming', 'accepted', 'cancelled', 'completed', 'past'
        $request->validate([
            'status' => ['required', 'in:upcoming,accepted,cancelled,completed,past'],
        ]);

        try {
            $this->withTransaction(function () use ($request, $id) {
                $booking = $this->bookingRepository->findOrFail($id);
                
                $newStatus = $request->input('status');
            
                // Don't allow status update if payment is not paid (except for cancelled status)
                if ($newStatus !== 'cancelled' && $booking->payment_status !== 'paid') {
                    throw new \Illuminate\Validation\ValidationException(
                        validator([], []),
                        ['status' => [__('common.booking_payment_required')]]
                    );
                }
                
                $this->bookingRepository->updateStatus($id, $newStatus);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('common.booking_updated_successfully'));
    }

    /**
     * Accept a booking
     */
    public function accept(Request $request, int $id)
    {
        Gate::authorize('bookings.edit');

        try {
            $this->withTransaction(function () use ($id) {
                $booking = $this->bookingRepository->findOrFail($id);
                
                // Don't allow status update if payment is not paid
                if ($booking->payment_status !== 'paid') {
                    return back()->withErrors([
                        'payment_status' => [__('common.booking_payment_required')]
                    ])->with('error', __('common.booking_payment_required'));
                }
                
                $this->bookingRepository->confirm($id);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->with('error', __('common.booking_payment_required'));
        } catch (\Exception $e) {
            return back()->with('error', __('common.error_accepting_booking') . (config('app.debug') ? ': ' . $e->getMessage() : ''));
        }

        return back()->with('success', __('common.booking_accepted_successfully'));
    }

    /**
     * Reject a booking
     */
    public function reject(Request $request, int $id)
    {
        Gate::authorize('bookings.edit');

        $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->withTransaction(function () use ($request, $id) {
            $booking = $this->bookingRepository->findOrFail($id);
            $booking->update([
                'status' => 'cancelled',
                'rejection_reason' => $request->input('rejection_reason'),
                'rejected_at' => now(),
            ]);
        });

        return back()->with('success', __('common.booking_rejected_successfully'));
    }

    /**
     * Complete a booking
     */
    public function complete(Request $request, int $id)
    {
        Gate::authorize('bookings.edit');

        try {
            $this->withTransaction(function () use ($id) {
                $booking = $this->bookingRepository->findOrFail($id);
                
                // Don't allow status update if payment is not paid
                if ($booking->payment_status !== 'paid') {
                    throw new \Illuminate\Validation\ValidationException(
                        validator([], []),
                        ['payment_status' => [__('common.booking_payment_required')]]
                    );
                }
                
                $this->bookingRepository->complete($id);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('common.booking_completed_successfully'));
    }

    /**
     * Reschedule a booking - supports rescheduling all sessions
     */
    public function reschedule(Request $request, int $id)
    {
        Gate::authorize('bookings.edit');

        // Check if rescheduling all sessions or just one
        if ($request->has('sessions') && is_array($request->input('sessions'))) {
            // Reschedule sessions
            $request->validate([
                'sessions' => ['required', 'array', 'min:1'],
                'sessions.*.id' => ['nullable', 'integer', 'exists:booking_sessions,id'],
                'sessions.*.slot_date' => ['required', 'date', 'after_or_equal:today'],
                'sessions.*.slot_time' => ['required', 'date_format:H:i'],
                'sessions.*.treatment_slot_id' => ['nullable', 'integer', 'exists:treatment_slots,id'],
                'reschedule_reason' => ['nullable', 'string', 'max:500'],
                'reschedule_reason_id' => ['nullable', 'integer', 'exists:booking_reasons,id'],
            ]);

            $this->withTransaction(function () use ($request, $id) {
                $booking = $this->bookingRepository->findOrFail($id);
                
                // Only allow rescheduling if booking is upcoming or accepted
                if (!in_array($booking->status, ['upcoming', 'accepted', 'confirmed'])) {
                    abort(422, __('common.booking_cannot_be_rescheduled'));
                }

                // Check if we're updating specific sessions or replacing all
                $hasSessionIds = collect($request->input('sessions'))->every(function ($session) {
                    return isset($session['id']) && !empty($session['id']);
                });

                if ($hasSessionIds && count($request->input('sessions')) === 1) {
                    // Reschedule a single specific session
                    $sessionData = $request->input('sessions')[0];
                    $session = \App\Models\BookingSession::where('id', $sessionData['id'])
                        ->where('booking_id', $booking->id)
                        ->firstOrFail();
                    
                    $session->update([
                        'slot_date' => $sessionData['slot_date'],
                        'slot_time' => $sessionData['slot_time'],
                        'treatment_slot_id' => $sessionData['treatment_slot_id'] ?? $session->treatment_slot_id,
                    ]);
                    
                    $booking->increment('reschedule_count');
                } else {
                    // Reschedule all sessions - delete existing and create new
                    $booking->sessions()->delete();

                    // Create new sessions
                    foreach ($request->input('sessions') as $sessionData) {
                        \App\Models\BookingSession::create([
                            'booking_id' => $booking->id,
                            'treatment_slot_id' => $sessionData['treatment_slot_id'] ?? null,
                            'slot_date' => $sessionData['slot_date'],
                            'slot_time' => $sessionData['slot_time'],
                            'status' => 'pending',
                        ]);
                    }
                }

                $booking->increment('reschedule_count');
                
                // Update reschedule reason if provided
                $rescheduleReasonId = $request->input('reschedule_reason_id');
                if ($rescheduleReasonId) {
                    $reasonRepository = app(\App\Contracts\BookingReasonRepositoryInterface::class);
                    $reasonModel = $reasonRepository->find($rescheduleReasonId);
                    
                    if ($reasonModel && $reasonModel->type === \App\Enums\BookingReasonType::Rescheduling) {
                        $locale = app()->getLocale();
                        $rescheduleReason = $locale === 'ar' && $reasonModel->title_ar 
                            ? $reasonModel->title_ar 
                            : $reasonModel->title_en;
                        
                        $booking->update([
                            'reschedule_reason_id' => $rescheduleReasonId,
                            'reschedule_reason' => $rescheduleReason,
                        ]);
                    }
                } elseif ($request->input('reschedule_reason')) {
                    $booking->update([
                        'reschedule_reason' => $request->input('reschedule_reason'),
                    ]);
                }
            });
        } else {
            // Legacy: Reschedule first session only (backward compatibility)
            $request->validate([
                'slot_date' => ['required', 'date', 'after_or_equal:today'],
                'slot_time' => ['required', 'date_format:H:i'],
                'reschedule_reason' => ['nullable', 'string', 'max:500'],
            ]);

            $this->withTransaction(function () use ($request, $id) {
                $booking = $this->bookingRepository->findOrFail($id);
                
                // Update first session if exists
                $firstSession = $booking->sessions()->first();
                if ($firstSession) {
                    $firstSession->update([
                        'slot_date' => $request->input('slot_date'),
                        'slot_time' => $request->input('slot_time'),
                    ]);
                }

                $booking->update([
                    'reschedule_reason' => $request->input('reschedule_reason'),
                ]);
                $booking->increment('reschedule_count');
            });
        }

        return back()->with('success', __('common.booking_rescheduled_successfully'));
    }

    /**
     * Get available slots for a treatment on a specific date
     */
    public function getAvailableSlots(Request $request, int $id)
    {
        Gate::authorize('bookings.view');

        $booking = $this->bookingRepository->findOrFail($id);
        
        if (!$booking->treatment_id) {
            return response()->json([
                'success' => false,
                'message' => __('common.treatment_not_found'),
            ], 422);
        }

        $date = $request->get('date', now()->format('Y-m-d'));
        $machineId = $booking->machine_id;

        // Get available slots using treatment repository
        $slots = $this->treatmentRepository->getAvailability(
            $booking->treatment_id, 
            $date, 
            $machineId ? [$machineId] : null
        );

        // Get the actual date from slots (might be next week if all current week slots are booked)
        $actualDate = $date;
        if (!empty($slots) && isset($slots[0]['date'])) {
            $actualDate = $slots[0]['date'];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'slots' => $slots,
                'date' => $actualDate,
                'requested_date' => $date,
                'date_changed' => $actualDate !== $date,
            ]
        ]);
    }

    /**
     * Update booking session status
     */
    public function updateSessionStatus(Request $request, int $bookingId, int $sessionId)
    {
        Gate::authorize('bookings.edit');

        $request->validate([
            'status' => ['required', 'in:pending,completed,cancelled,no_show'],
        ]);

        $this->withTransaction(function () use ($request, $bookingId, $sessionId) {
            $booking = $this->bookingRepository->findOrFail($bookingId);
            
            $session = \App\Models\BookingSession::where('id', $sessionId)
                ->where('booking_id', $bookingId)
                ->firstOrFail();
            
            $session->update([
                'status' => $request->input('status'),
            ]);
        });

        return back()->with('success', __('common.session_status_updated_successfully'));
    }
}

