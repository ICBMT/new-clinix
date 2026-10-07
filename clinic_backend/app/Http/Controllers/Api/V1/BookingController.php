<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Booking\StoreBookingRequest;
use App\Http\Requests\Api\V1\Booking\CancelBookingRequest;
use App\Http\Requests\Api\V1\Booking\RescheduleBookingRequest;
use App\Http\Requests\Api\V1\Booking\EditBookingRequest;
use App\Http\Requests\Api\V1\Booking\RescheduleAllSessionsRequest;
use App\Http\Resources\Api\V1\Booking\BookingResource;
use App\Contracts\BookingRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Models\Booking;
use App\Models\Refund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingRepositoryInterface $bookingRepository,
        private readonly TreatmentRepositoryInterface $treatmentRepository,
        private readonly \App\Contracts\ClinicRepositoryInterface $clinicRepository,
        private readonly \App\Contracts\MachineRepositoryInterface $machineRepository,
        private readonly \App\Contracts\MediaRepositoryInterface $mediaRepository,
        private readonly \App\Contracts\WalletRepositoryInterface $walletRepository
    ) {}

    /**
     * Create a new booking with multiple sessions
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $data = $request->validated();

            // Get treatment to calculate pricing
            $treatmentId = $data['treatment_id'] ?? $data['service_id'] ?? null;
            if (!$treatmentId) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.treatment_id_required'),
                ], 422);
            }
            
            $treatment = $this->treatmentRepository->findOrFail($treatmentId);
            
            // Get clinic and validate it's active/approved
            $clinicId = $data['clinic_id'] ?? null;
            if (!$clinicId) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.clinic_id_required'),
                ], 422);
            }
            
            $clinic = $this->clinicRepository->find($clinicId);
            if (!$clinic) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.clinic_not_found'),
                ], 404);
            }
            
            // Check if clinic is approved and active
            if ($clinic->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => __('common.clinic_not_available_for_booking'),
                ], 422);
            }
            
            // Check if clinic is approved and active
            if ($clinic->user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => __('common.clinic_not_available'),
                ], 422);
            }

            // Validate total_sessions against treatment's max_sessions
            $totalSessions = $data['total_sessions'] ?? 1;
            $maxSessions = $treatment->max_sessions ?? 5; // Default to 5 if not set
            
            if ($totalSessions > $maxSessions) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.total_sessions_exceeds_max', ['max' => $maxSessions]),
                    'errors' => [
                        'total_sessions' => [__('common.total_sessions_exceeds_max', ['max' => $maxSessions])],
                    ],
                ], 422);
            }

            // Validate machine if provided
            if (isset($data['machine_id'])) {
                $machine = $this->machineRepository->find($data['machine_id']);
                
                if (!$machine || $machine->clinic_id != $clinicId || $machine->status !== 'ready') {
                    return response()->json([
                        'success' => false,
                        'message' => __('common.machine_not_found_or_not_ready'),
                    ], 422);
                }

                // Check if machine supports this treatment using relationship
                if (!$machine->treatments()->where('treatments.id', $treatmentId)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => __('common.machine_does_not_support_treatment'),
                    ], 422);
                }
            }

            // Calculate pricing
            $basePrice = (float) $treatment->final_price;
            $addOnsTotal = 0;
            
            if (isset($data['addon_ids']) && !empty($data['addon_ids'])) {
                // Get addons using treatment relationship
                $addOns = $treatment->addOns()->whereIn('id', $data['addon_ids'])->get();
                
                $addOnsTotal = $addOns->sum(function ($addOn) {
                    return (float) $addOn->price;
                });
            }

            $subtotal = $basePrice + $addOnsTotal;
            $totalAmount = $subtotal; // Can add tax, discount logic here

            // Generate unique booking reference
            $bookingReference = 'BK' . strtoupper(Str::random(8)) . now()->format('Ymd');

            // Handle patient data - use provided data or fallback to authenticated user's info
            $patientName = $data['patient_name'] ?? $user->name;
            $patientPhone = $data['patient_phone'] ?? $user->phone;
            $patientAge = $data['patient_age'] ?? ($user->date_of_birth ? now()->diffInYears($user->date_of_birth) : null);
            $patientGender = $data['patient_gender'] ?? $user->gender;
            // Get patient skin type - use provided ID or try to find from user's skin_type string field
            // Note: SkinType doesn't have a repository, using model directly with scope
            $patientSkinTypeId = $data['patient_skin_type_id'] ?? null;
            if (!$patientSkinTypeId && $user->skin_type) {
                $userSkinType = \App\Models\SkinType::active()
                    ->where(function($q) use ($user) {
                        $q->where('name_en', $user->skin_type)
                          ->orWhere('name_ar', $user->skin_type);
                    })
                    ->first();
                if ($userSkinType) {
                    $patientSkinTypeId = $userSkinType->id;
                }
            }
            
            // Get patient body part
            $patientBodyPartId = $data['patient_body_part_id'] ?? null;

            // Handle medical record IDs - validate and save IDs only using repository
            $medicalRecordIds = null;
            if (isset($data['medical_record_ids']) && is_array($data['medical_record_ids']) && !empty($data['medical_record_ids'])) {
                // Validate that all medical records belong to the user using repository
                $userMedicalRecordIds = [];
                foreach ($data['medical_record_ids'] as $recordId) {
                    $record = $this->mediaRepository->findMedicalRecord($recordId, $user->id);
                    if ($record) {
                        $userMedicalRecordIds[] = $record->id;
                    }
                }

                if (count($userMedicalRecordIds) !== count($data['medical_record_ids'])) {
                    return response()->json([
                        'success' => false,
                        'message' => __('common.some_medical_records_not_found'),
                    ], 422);
                }

                $medicalRecordIds = $userMedicalRecordIds;
            }

            // Create booking
            $bookingData = [
                'booking_reference' => $bookingReference,
                'user_id' => $user->id,
                'clinic_id' => $data['clinic_id'] ?? null,
                'treatment_id' => $treatmentId,
                'machine_id' => $data['machine_id'] ?? null,
                'total_sessions' => $data['total_sessions'],
                'base_price' => (string) $basePrice,
                'subtotal' => (string) $subtotal,
                'total_amount' => (string) $totalAmount,
                'currency' => $treatment->currency ?? 'KWD',
                'payment_type' => 'full',
                'status' => 'upcoming', // Changed from 'pending' to 'upcoming' to match enum values
                'payment_status' => 'pending',
                'special_instructions' => $data['notes'] ?? null,
                'patient_name' => $patientName,
                'patient_phone' => $patientPhone,
                'patient_age' => $patientAge,
                'patient_gender' => $patientGender,
                'patient_skin_type_id' => $patientSkinTypeId,
                'patient_body_part_id' => $patientBodyPartId,
                'medical_questionnaire' => $data['medical_questionnaire'] ?? null,
                'medical_record_ids' => $medicalRecordIds,
            ];

            // Validate that number of sessions matches total_sessions
            $sessionsCount = isset($data['sessions']) && is_array($data['sessions']) ? count($data['sessions']) : 0;
            if ($sessionsCount !== $totalSessions) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.sessions_count_mismatch', ['expected' => $totalSessions, 'provided' => $sessionsCount]),
                    'errors' => [
                        'sessions' => [__('common.sessions_count_mismatch', ['expected' => $totalSessions, 'provided' => $sessionsCount])],
                    ],
                ], 422);
            }

  
            $booking = $this->bookingRepository->createBooking($bookingData);

            // Create booking sessions using booking relationship
            if (isset($data['sessions']) && is_array($data['sessions'])) {
                foreach ($data['sessions'] as $sessionData) {
                    $booking->sessions()->create([
                        'treatment_slot_id' => $sessionData['treatment_slot_id'] ?? null,
                        'slot_date' => $sessionData['slot_date'],
                        'slot_time' => $sessionData['slot_time'],
                        'status' => 'pending', // Default status
                    ]);
                }
            }

            // Create booking add-ons if any
            if (isset($data['addon_ids']) && !empty($data['addon_ids'])) {
                foreach ($addOns as $addOn) {
                    $this->bookingRepository->createBookingAddOn([
                        'booking_id' => $booking->id,
                        'treatment_add_on_id' => $addOn->id,
                        'quantity' => 1,
                        'price' => $addOn->price,
                    ]);
                }
            }

            // Handle booking documents - can include both medical records and uploaded documents
            // Accept booking_document_ids parameter which contains array of media IDs
            if (isset($data['booking_document_ids']) && !empty($data['booking_document_ids']) && is_array($data['booking_document_ids'])) {
                $documentIds = $data['booking_document_ids'];
                
                // Get all documents that belong to the user using repository
                // Validate each document belongs to user
                $documents = collect();
                foreach ($documentIds as $docId) {
                    $document = $this->mediaRepository->findBy([
                        'id' => $docId,
                        'mediable_type' => \App\Models\User::class,
                        'mediable_id' => $user->id,
                    ]);
                    if ($document) {
                        $documents->push($document);
                    }
                }

                $documentCount = 0;
                foreach ($documents as $document) {
                    // Create booking document using booking's media relationship
                    $booking->media()->create([
                        'file_name' => $document->file_name,
                        'collection_name' => 'booking_session_documents',
                        'disk' => $document->disk ?? 'public',
                        'size' => $document->size ?? 0,
                    ]);
                    $documentCount++;
                }
                
                if ($documentCount > 0) {
                    // Update documents_count using repository
                    $currentCount = $booking->documents_count ?? 0;
                    $this->bookingRepository->update($booking->id, ['documents_count' => $currentCount + $documentCount]);
                    $booking->refresh();
                }
            }

            // Handle new document uploads using booking's media relationship
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $path = $file->store('bookings/documents', 'public');
                    
                    $booking->media()->create([
                        'file_name' => url(Storage::url($path)), // Generate full URL with domain
                        'collection_name' => 'booking_session_documents',
                        'disk' => 'public',
                        'size' => $file->getSize(),
                    ]);
                }
                // Update documents_count using repository
                $currentCount = $booking->documents_count ?? 0;
                $this->bookingRepository->update($booking->id, ['documents_count' => $currentCount + count($request->file('documents'))]);
                $booking->refresh();
            }

            // Load relations for response
            $booking->load(['treatment', 'clinic.governorate', 'clinic.area', 'machine', 'sessions', 'media', 'user']);

            // Load treatment relationship for duration_minutes
            $booking->load('treatment');
            
            return response()->json([
                'success' => true,
                'message' => __('common.booking_created_successfully'),
                'data' => [
                    'booking' => new BookingResource($booking),
                ]
            ], 201);
        });
    }

    /**
     * Get user bookings
     */
    public function index(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $status = $request->get('status');
        
        // Get isReviewed parameter (can be 'true', 'false', or null)
        $isReviewedParam = $request->get('isReviewed');
        $isReviewed = null;
        if ($isReviewedParam !== null) {
            $isReviewed = filter_var($isReviewedParam, FILTER_VALIDATE_BOOLEAN);
        }

        $bookings = $this->bookingRepository->getUserBookings($user->id, $status, $perPage, $isReviewed);
        
        // Load necessary relations for each booking
        $bookings->getCollection()->transform(function ($booking) {
            // Reload clinic with all necessary fields including policies
            $booking->load([
                'treatment', 
                'clinic' => function($q) {
                    $q->select([
                        'id', 'name_en', 'name_ar', 'email', 'phone', 'address', 
                        'governorate_id', 'area_id', 'block', 'street', 'avenue', 
                        'house', 'floor', 'apt', 'city', 'state', 'country', 
                        'postal_code', 'latitude', 'longitude', 'logo',
                        'cancellation_policy_en', 'cancellation_policy_ar',
                        'refund_policy_en', 'refund_policy_ar',
                        'rescheduling_policy_en', 'rescheduling_policy_ar',
                    ])->with(['governorate', 'area', 'media']);
                },
                'sessions'
            ]);
            return $booking;
        });

            return response()->json([
                'success' => true,
                'data' => [
                    'bookings' => BookingResource::collection($bookings->items()),
                    'pagination' => $this->formatPaginationResponse($bookings)
                ]
            ]);
        });
    }

    /**
     * Get booking details
     */
    public function show(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
        $booking = $this->bookingRepository->findWithRelations($id);

        // Verify user owns this booking
        if ($booking->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => __('common.booking_not_found'),
            ], 404);
        }

            // Load all relations with clinic policy fields
            $booking->load([
                'treatment', 
                'clinic' => function($q) {
                    $q->select([
                        'id', 'name_en', 'name_ar', 'email', 'phone', 'address', 
                        'governorate_id', 'area_id', 'block', 'street', 'avenue', 
                        'house', 'floor', 'apt', 'city', 'state', 'country', 
                        'postal_code', 'latitude', 'longitude', 'logo',
                        'cancellation_policy_en', 'cancellation_policy_ar',
                        'refund_policy_en', 'refund_policy_ar',
                        'rescheduling_policy_en', 'rescheduling_policy_ar',
                    ])->with(['governorate', 'area', 'media']);
                },
                'machine', 
                'sessions', 
                'media', 
                'patientSkinType', 
                'patientBodyPart'
            ]);
            
            if (\Illuminate\Support\Facades\Schema::hasTable('booking_add_ons')) {
                $booking->load('addOns');
            }

            // Load medical records using the relationship
            $medicalRecords = $booking->medicalRecords()->get();
            $booking->setRelation('medicalRecords', $medicalRecords);

            return response()->json([
                'success' => true,
                'data' => [
                    'booking' => new BookingResource($booking),
                ]
            ]);
        });
    }

    /**
     * Edit booking
     */
    public function update(int $id, EditBookingRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $data = $request->validated();
            $booking = $this->bookingRepository->findOrFail($id);

            // Verify user owns this booking
            if ($booking->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                ], 404);
            }

            // Only allow editing if booking is upcoming
            if ($booking->status !== 'upcoming') {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_cannot_be_edited'),
                ], 422);
            }

            // IMPORTANT: Store documents count before update to verify preservation
            $documentsCountBefore = $booking->documents_count ?? 0;
            
            // Update booking - ONLY update specific allowed fields
            // Documents are NOT touched during this update - they are preserved automatically
            $updateData = [];
            if (isset($data['machine_id'])) {
                $updateData['machine_id'] = $data['machine_id'];
            }
            // Duration is stored in treatment, not booking - no need to update it here
            if (isset($data['notes'])) {
                $updateData['notes'] = $data['notes'];
            }
            if (isset($data['special_instructions'])) {
                $updateData['special_instructions'] = $data['special_instructions'];
            }
            
            // Handle patient data update - use provided data or keep existing or fallback to user
            if (isset($data['patient_name']) || isset($data['patient_phone']) || isset($data['patient_age']) || isset($data['patient_gender']) || isset($data['patient_skin_type_id']) || isset($data['patient_body_part_id'])) {
                $booking->load('user');
                $updateData['patient_name'] = $data['patient_name'] ?? $booking->patient_name ?? $booking->user->name ?? null;
                $updateData['patient_phone'] = $data['patient_phone'] ?? $booking->patient_phone ?? $booking->user->phone ?? null;
                $updateData['patient_age'] = $data['patient_age'] ?? $booking->patient_age ?? ($booking->user->date_of_birth ? now()->diffInYears($booking->user->date_of_birth) : null);
                $updateData['patient_gender'] = $data['patient_gender'] ?? $booking->patient_gender ?? $booking->user->gender ?? null;
                
                // Handle skin type - use provided, keep existing, or fallback to user's skin type
                // Note: SkinType doesn't have a repository, using model directly with scope
                if (isset($data['patient_skin_type_id'])) {
                    $updateData['patient_skin_type_id'] = $data['patient_skin_type_id'];
                } elseif (!$booking->patient_skin_type_id && $booking->user && $booking->user->skin_type) {
                    $userSkinType = \App\Models\SkinType::active()
                        ->where(function($q) use ($booking) {
                            $q->where('name_en', $booking->user->skin_type)
                              ->orWhere('name_ar', $booking->user->skin_type);
                        })
                        ->first();
                    if ($userSkinType) {
                        $updateData['patient_skin_type_id'] = $userSkinType->id;
                    }
                }
                
                // Handle body part - use provided or keep existing
                if (isset($data['patient_body_part_id'])) {
                    $updateData['patient_body_part_id'] = $data['patient_body_part_id'];
                }
            }

            // Handle medical record IDs - validate and save IDs only using repository
            if (isset($data['medical_record_ids'])) {
                if (is_array($data['medical_record_ids']) && !empty($data['medical_record_ids'])) {
                    // Validate that all medical records belong to the user using repository
                    $userMedicalRecordIds = [];
                    foreach ($data['medical_record_ids'] as $recordId) {
                        $record = $this->mediaRepository->findMedicalRecord($recordId, $user->id);
                        if ($record) {
                            $userMedicalRecordIds[] = $record->id;
                        }
                    }

                    if (count($userMedicalRecordIds) !== count($data['medical_record_ids'])) {
                        return response()->json([
                            'success' => false,
                            'message' => __('common.some_medical_records_not_found'),
                        ], 422);
                    }

                    $updateData['medical_record_ids'] = $userMedicalRecordIds;
                } else {
                    $updateData['medical_record_ids'] = null;
                }
            }

            // Update only the specified fields using repository - documents and media relationships are NOT affected
            if (!empty($updateData)) {
                $booking = $this->bookingRepository->update($booking->id, $updateData);
            }
            
            // Refresh the booking to ensure relationships are current
            $booking->refresh();
            
            // Verify documents are preserved (safety check)
            $documentsCountAfter = $booking->documents_count ?? 0;
            if ($documentsCountBefore !== $documentsCountAfter) {
                Log::warning("Booking {$booking->id} documents count changed during update: {$documentsCountBefore} -> {$documentsCountAfter}");
            }
            
            // Load all necessary relationships including media (documents)
            $booking->load(['treatment', 'clinic.governorate', 'clinic.area', 'machine', 'sessions', 'media', 'user']);

            return response()->json([
                'success' => true,
                'message' => __('common.booking_updated_successfully'),
                'data' => [
                    'booking' => new BookingResource($booking),
                ]
            ]);
        });
    }

    /**
     * Cancel booking
     */
    public function cancel(int $id, CancelBookingRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $data = $request->validated();
            $booking = $this->bookingRepository->findOrFail($id);

            // Verify user owns this booking
            if ($booking->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                ], 404);
            }

            // Check buffer time for cancellation
            $firstSession = $booking->sessions()->orderBy('slot_date')->orderBy('slot_time')->first();
            if ($firstSession && $firstSession->slot_date && $firstSession->slot_time) {
                $bookingDateTime = \Carbon\Carbon::parse($firstSession->slot_date->format('Y-m-d') . ' ' . $firstSession->slot_time->format('H:i:s'));
                $now = \Carbon\Carbon::now();
                
                // Only check buffer time if booking is in the future
                if ($bookingDateTime->isFuture()) {
                    // Get buffer hours from clinic settings or site defaults
                    $clinic = $booking->clinic;
                    // Check clinic first, if not set, get from site settings
                    $bufferHours = $clinic->cancellation_buffer_hours !== null 
                        ? (int) $clinic->cancellation_buffer_hours 
                        : \App\Services\SiteSettingsService::getCancellationBufferHours();
                    
                    // Calculate hours until booking (positive number for future bookings)
                    $hoursUntilBooking = $now->diffInHours($bookingDateTime, false);
                    
                    // Block cancellation if there are fewer hours until booking than the buffer time
                    // Example: If buffer is 14 hours, user can only cancel if booking is more than 14 hours away
                    if ($hoursUntilBooking < $bufferHours) {
                        return response()->json([
                            'success' => false,
                            'message' => __('common.cancellation_not_allowed_within_buffer_time', ['hours' => $bufferHours]),
                        ], 422);
                    }
                }
            }

            // Cancel booking - repository will handle reason lookup
            $cancellationReason = $data['cancellation_reason'] ?? null;
            $cancellationReasonId = $data['cancellation_reason_id'] ?? null;
            
            $booking = $this->bookingRepository->cancel($id, $cancellationReason, $cancellationReasonId);
            $booking->load('clinic');

            // Process refund if booking was paid
            if ($booking->payment_status === 'paid' && $booking->total_amount > 0) {
                $totalAmount = (float) $booking->total_amount;
                
                // Step 1: Calculate user penalty (from site settings)
                $penaltyType = \App\Services\SiteSettingsService::getUserCancellationPenaltyType();
                $penaltyValue = \App\Services\SiteSettingsService::getUserCancellationPenaltyValue();
                
                $penaltyAmount = 0;
                if ($penaltyType === 'percentage') {
                    $penaltyAmount = $totalAmount * ($penaltyValue / 100);
                } else {
                    $penaltyAmount = $penaltyValue;
                }
                $penaltyAmount = round($penaltyAmount, 2);
                
                // Step 2: Calculate remaining amount after penalty
                $remainingAfterPenalty = $totalAmount - $penaltyAmount;
                
                // Step 3: Get clinic refund policy (from clinic settings or site defaults)
                $clinic = $booking->clinic;
                // Get refund policy type: check clinic first, if not set, get from site settings
                $refundPolicyType = $clinic->refund_policy_type !== null 
                    ? $clinic->refund_policy_type 
                    : \App\Services\SiteSettingsService::getClinicRefundPolicyType();
                
                // Get refund policy value: check clinic first, if not set, get from site settings
                $refundPolicyValue = $clinic->refund_policy_percentage !== null 
                    ? (float) $clinic->refund_policy_percentage 
                    : \App\Services\SiteSettingsService::getClinicRefundPolicyValue();
                
                // Step 4: Calculate clinic charge
                $clinicChargeAmount = 0;
                $clinicEarningAmount = 0;
                
                if ($refundPolicyType === 'full') {
                    // Full refund - clinic gets 0, user gets remaining after penalty
                    $clinicChargeAmount = 0;
                    $clinicEarningAmount = 0;
                } elseif ($refundPolicyType === 'fixed') {
                    // Fixed charge - clinic charges fixed amount
                    $clinicChargeAmount = (float) $refundPolicyValue;
                    $clinicEarningAmount = $clinicChargeAmount;
                } elseif ($refundPolicyType === 'partial') {
                    // Partial charge - clinic charges percentage
                    $clinicChargeAmount = $remainingAfterPenalty * ($refundPolicyValue / 100);
                    $clinicEarningAmount = $clinicChargeAmount;
                }
                $clinicChargeAmount = round($clinicChargeAmount, 2);
                $clinicEarningAmount = round($clinicEarningAmount, 2);
                
                // Step 5: Calculate final refund to user wallet
                $refundToWallet = $remainingAfterPenalty - $clinicChargeAmount;
                $refundToWallet = round($refundToWallet, 2);
                
                // Step 6: Add refund to user wallet
                if ($refundToWallet > 0) {
                    $this->walletRepository->addRefund(
                        $user->id,
                        $refundToWallet,
                        "Refund for cancelled booking: {$booking->booking_reference}",
                        "BK-{$booking->id}",
                        $booking
                    );
                }
                
                // Step 7: Generate clinic earning if clinic charged anything
                if ($clinicEarningAmount > 0) {
                    $this->generateClinicEarningFromCancellation($booking, $clinicEarningAmount);
                }
                
                // Create refund record for tracking
                    $booking->refunds()->create([
                        'user_id' => $user->id,
                        'reason_id' => $booking->cancellation_reason_id,
                    'amount' => $refundToWallet,
                        'reason' => $booking->cancellation_reason ?? 'Booking cancelled',
                    'description' => "Refund processed: Penalty {$penaltyAmount}, Clinic charge {$clinicChargeAmount}, Refunded {$refundToWallet}",
                    'status' => 'processed',
                    'processed_at' => now(),
                    ]);
                    
                // Update booking with refund information
                    $this->bookingRepository->update($booking->id, [
                    'refund_amount' => $refundToWallet,
                        'refund_reason' => $booking->cancellation_reason,
                    'refunded_at' => now(),
                    ]);
            }

            $booking->refresh();
            return response()->json([
                'success' => true,
                'message' => __('common.booking_cancelled_successfully'),
                'data' => [
                    'booking' => new BookingResource($booking),
                ]
            ]);
        });
    }

    /**
     * Generate clinic earning from cancellation charge
     */
    private function generateClinicEarningFromCancellation(Booking $booking, float $grossAmount): void
    {
        // Get commission rate from clinic owner's admin_commission
        $clinic = $booking->clinic;
        $commissionRate = 10.00; // Default fallback
        
        if ($clinic->owner && $clinic->owner->admin_commission !== null) {
            $commissionRate = (float) $clinic->owner->admin_commission;
        } else {
            $commissionRate = (float) \App\Models\SiteSetting::getValue('vendor_default_commission', 10.00);
        }
        
        // Get platform fee from site settings (no fixed charges for cancellation earnings)
        $platformFeeType = \App\Models\SiteSetting::getValue('vendor_platform_fee_type', 'percentage');
        $platformFeeValue = (float) \App\Models\SiteSetting::getValue('vendor_platform_fee', 0);
        
        // Calculate amounts
        $commissionAmount = $grossAmount * ($commissionRate / 100);
        
        // Calculate platform fee based on type
        if ($platformFeeType === 'fixed') {
            $platformFee = $platformFeeValue;
        } else {
            $platformFee = $grossAmount * ($platformFeeValue / 100);
        }
        
        // No fixed charges for cancellation earnings
        $totalDeductions = $commissionAmount + $platformFee;
        $netAmount = $grossAmount - $totalDeductions;

        // Round all values
        $grossAmount = round($grossAmount, 2);
        $commissionAmount = round($commissionAmount, 2);
        $platformFee = round($platformFee, 2);
        $netAmount = round($netAmount, 2);

        // Create clinic earning
        \App\Models\ClinicEarning::create([
            'clinic_id' => $booking->clinic_id,
            'booking_id' => $booking->id,
            'gross_amount' => $grossAmount,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'platform_fee' => $platformFee,
            'fixed_charges' => 0, // No fixed charges for cancellation earnings
            'net_amount' => $netAmount,
            'currency' => $booking->currency ?? 'KWD',
            'status' => 'pending',
        ]);
    }

    /**
     * Reschedule single session (legacy - kept for backward compatibility)
     */
    public function reschedule($id, RescheduleBookingRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $id = (int) $id;
            $data = $request->validated();
            $user = $request->user();
            $booking = $this->bookingRepository->findOrFail($id);

            // Verify user owns this booking
            if ($booking->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                ], 404);
            }

            // Check buffer time for rescheduling
            $firstSession = $booking->sessions()->orderBy('slot_date')->orderBy('slot_time')->first();
            if ($firstSession && $firstSession->slot_date && $firstSession->slot_time) {
                $bookingDateTime = \Carbon\Carbon::parse($firstSession->slot_date->format('Y-m-d') . ' ' . $firstSession->slot_time->format('H:i:s'));
                $now = \Carbon\Carbon::now();
                
                // Only check buffer time if booking is in the future
                if ($bookingDateTime->isFuture()) {
                    // Get buffer hours from clinic settings or site defaults
                    $clinic = $booking->clinic;
                    // Check clinic first, if not set, get from site settings
                    $bufferHours = $clinic->rescheduling_buffer_hours !== null 
                        ? (int) $clinic->rescheduling_buffer_hours 
                        : \App\Services\SiteSettingsService::getReschedulingBufferHours();
                    
                    // Calculate hours until booking (positive number for future bookings)
                    $hoursUntilBooking = $now->diffInHours($bookingDateTime, false);
                    
                    // Block rescheduling if there are fewer hours until booking than the buffer time
                    // Example: If buffer is 14 hours, user can only reschedule if booking is more than 14 hours away
                    if ($hoursUntilBooking < $bufferHours) {
                        return response()->json([
                            'success' => false,
                            'message' => __('common.rescheduling_not_allowed_within_buffer_time', ['hours' => $bufferHours]),
                        ], 422);
                    }
                }
            }

            // Reschedule first session using booking relationship
            $firstSession = $booking->sessions()->first();
            if ($firstSession) {
                $firstSession->update([
                    'slot_date' => $data['slot_date'],
                    'slot_time' => $data['slot_time'],
                    'treatment_slot_id' => $data['treatment_slot_id'] ?? null,
                ]);
            }

            // Update booking using repository
            $this->bookingRepository->update($booking->id, ['reschedule_count' => $booking->reschedule_count + 1]);
            $booking->refresh();
            
            // Update reschedule reason if provided - use repository pattern
            $rescheduleReasonId = $data['reschedule_reason_id'] ?? null;
            if ($rescheduleReasonId) {
                $reasonRepository = app(\App\Contracts\BookingReasonRepositoryInterface::class);
                $reasonModel = $reasonRepository->find($rescheduleReasonId);
                
                if ($reasonModel && $reasonModel->type === \App\Enums\BookingReasonType::Rescheduling) {
                    // Get localized reason text
                    $locale = app()->getLocale();
                    $rescheduleReason = $locale === 'ar' && $reasonModel->title_ar 
                        ? $reasonModel->title_ar 
                        : $reasonModel->title_en;
                    
                    $this->bookingRepository->update($booking->id, [
                        'reschedule_reason_id' => $rescheduleReasonId,
                        'reschedule_reason' => $rescheduleReason,
                    ]);
                    $booking->load('rescheduleReason');
                }
            }
            
            $booking->load(['treatment', 'clinic.governorate', 'clinic.area', 'machine', 'sessions', 'media']);

            return response()->json([
                'success' => true,
                'message' => __('common.booking_rescheduled_successfully'),
                'data' => [
                    'booking' => new BookingResource($booking),
                ]
            ]);
        });
    }

    /**
     * Reschedule all sessions
     */
    public function rescheduleAllSessions(int $id, RescheduleAllSessionsRequest $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $data = $request->validated();
            $booking = $this->bookingRepository->findOrFail($id);

            // Verify user owns this booking
            if ($booking->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                ], 404);
            }

            // Only allow rescheduling if booking is upcoming or accepted
            if (!in_array($booking->status, ['upcoming', 'accepted'])) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_cannot_be_rescheduled'),
                ], 422);
            }

            // Check buffer time for rescheduling
            $firstSession = $booking->sessions()->orderBy('slot_date')->orderBy('slot_time')->first();
            if ($firstSession && $firstSession->slot_date && $firstSession->slot_time) {
                $bookingDateTime = \Carbon\Carbon::parse($firstSession->slot_date->format('Y-m-d') . ' ' . $firstSession->slot_time->format('H:i:s'));
                $now = \Carbon\Carbon::now();
                
                // Only check buffer time if booking is in the future
                if ($bookingDateTime->isFuture()) {
                    // Get buffer hours from clinic settings or site defaults
                    $clinic = $booking->clinic;
                    // Check clinic first, if not set, get from site settings
                    $bufferHours = $clinic->rescheduling_buffer_hours !== null 
                        ? (int) $clinic->rescheduling_buffer_hours 
                        : \App\Services\SiteSettingsService::getReschedulingBufferHours();
                    
                    // Calculate hours until booking (positive number for future bookings)
                    $hoursUntilBooking = $now->diffInHours($bookingDateTime, false);
                    
                    // Block rescheduling if there are fewer hours until booking than the buffer time
                    // Example: If buffer is 14 hours, user can only reschedule if booking is more than 14 hours away
                    if ($hoursUntilBooking < $bufferHours) {
                        return response()->json([
                            'success' => false,
                            'message' => __('common.rescheduling_not_allowed_within_buffer_time', ['hours' => $bufferHours]),
                        ], 422);
                    }
                }
            }

            // Delete existing sessions using booking relationship
            $booking->sessions()->delete();

            // Create new sessions using booking relationship
            foreach ($data['sessions'] as $sessionData) {
                $booking->sessions()->create([
                    'treatment_slot_id' => $sessionData['treatment_slot_id'] ?? null,
                    'slot_date' => $sessionData['slot_date'],
                    'slot_time' => $sessionData['slot_time'],
                    'status' => 'pending', // Default status
                ]);
            }

            // Update booking using repository
            $this->bookingRepository->update($booking->id, ['reschedule_count' => $booking->reschedule_count + 1]);
            $booking->refresh();
            
            // Update reschedule reason if provided - use repository pattern
            $rescheduleReasonId = $data['reschedule_reason_id'] ?? null;
            if ($rescheduleReasonId) {
                $reasonRepository = app(\App\Contracts\BookingReasonRepositoryInterface::class);
                $reasonModel = $reasonRepository->find($rescheduleReasonId);
                
                if ($reasonModel && $reasonModel->type === \App\Enums\BookingReasonType::Rescheduling) {
                    // Get localized reason text
                    $locale = app()->getLocale();
                    $rescheduleReason = $locale === 'ar' && $reasonModel->title_ar 
                        ? $reasonModel->title_ar 
                        : $reasonModel->title_en;
                    
                    $this->bookingRepository->update($booking->id, [
                        'reschedule_reason_id' => $rescheduleReasonId,
                        'reschedule_reason' => $rescheduleReason,
                    ]);
                    $booking->load('rescheduleReason');
                }
            }
            
            $booking->load(['treatment', 'clinic.governorate', 'clinic.area', 'machine', 'sessions', 'media']);

            return response()->json([
                'success' => true,
                'message' => __('common.sessions_rescheduled_successfully'),
                'data' => [
                    'booking' => new BookingResource($booking),
                ]
            ]);
        });
    }

    /**
     * Get booking sessions
     */
    public function getSessions(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $booking = $this->bookingRepository->findOrFail($id);

            // Verify user owns this booking
            if ($booking->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                ], 404);
            }

            // Use booking relationship to get sessions
            $sessions = $booking->sessions()->orderBy('slot_date')->orderBy('slot_time')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'sessions' => \App\Http\Resources\Api\V1\Booking\BookingSessionResource::collection($sessions),
                    'total_sessions' => $sessions->count(),
                    'completed_sessions' => $sessions->where('status', 'completed')->count(),
                    'pending_sessions' => $sessions->where('status', 'pending')->count(),
                ]
            ]);
        });
    }


    /**
     * Get available slots for booking
     */
    public function getAvailableSlots(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $treatmentId = $request->get('treatment_id');
            $date = $request->get('date', now()->format('Y-m-d'));
            $machineId = $request->get('machine_id');
            $selectedSessions = $request->get('selected_sessions', []); // Array of already selected session dates

            if (!$treatmentId) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.treatment_id_required'),
                ], 422);
            }

            // Use treatment repository to get available slots
            $slots = $this->treatmentRepository->getAvailability($treatmentId, $date, $machineId ? [$machineId] : null);

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
        });
    }


    /**
     * Get booking history
     */
    public function getHistory(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            $perPage = $request->get('per_page', 15);
            $status = $request->get('status', 'completed');
            
            // Support both single date and date range
            $date = $request->get('date');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            
            // If single date is provided, use it as both start and end date
            if ($date && !$startDate && !$endDate) {
                $startDate = $date;
                $endDate = $date;
            }

            $bookings = $this->bookingRepository->getUserBookings($user->id, $status, $perPage, null, $startDate, $endDate);

            // Calculate summary statistics using user relationship
            // Use user's bookings relationship for optimal performance
            $user->load('bookings');
            $userBookings = $user->bookings();
            
            if ($status) {
                $userBookings->where('status', $status);
            }

            // Apply date filter to summary (use the same date range as bookings)
            if ($startDate && $endDate) {
                $userBookings->whereHas('sessions', function($q) use ($startDate, $endDate) {
                    $q->whereBetween('slot_date', [$startDate, $endDate]);
                });
            }

            // Total sessions - sum of total_sessions from all bookings
            $totalSessions = (clone $userBookings)->sum('total_sessions');
            
            // Total payments - sum of total_amount from paid bookings using user relationship
            $paidBookings = $user->bookings()->where('payment_status', 'paid');
            
            if ($status) {
                $paidBookings->where('status', $status);
            }

            // Apply date filter to payments
            if ($startDate && $endDate) {
                $paidBookings->whereHas('sessions', function($q) use ($startDate, $endDate) {
                    $q->whereBetween('slot_date', [$startDate, $endDate]);
                });
            }
            
            $totalPaymentsAmount = $paidBookings->sum('total_amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'bookings' => BookingResource::collection($bookings->items()),
                    'summary' => [
                        'total_sessions' => (int) $totalSessions,
                        'total_payments' => (float) $totalPaymentsAmount,
                    ],
                    'pagination' => $this->formatPaginationResponse($bookings)
                ]
            ]);
        });
    }

    /**
     * Get booking statistics
     */
    public function getStatistics(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            $user = $request->user();
            
            // Calculate statistics using repository and model relationships
            // Get all bookings for statistics calculation
            $allBookings = $this->bookingRepository->getUserBookings($user->id, null, 1000);
            $bookingsCollection = $allBookings->getCollection();
            
            $stats = [
                'total_sessions' => $bookingsCollection->where('status', 'completed')->sum('total_sessions'),
                'total_payments' => $bookingsCollection->where('payment_status', 'paid')->sum('total_amount'),
                'upcoming_count' => $bookingsCollection->whereIn('status', ['upcoming', 'accepted'])->count(),
                'completed_count' => $bookingsCollection->where('status', 'completed')->count(),
                'cancelled_count' => $bookingsCollection->where('status', 'cancelled')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'statistics' => $stats,
                ]
            ]);
        });
    }

    /**
     * Get treatment records for a booking
     */
    /**
     * Get all active skin types for patient information
     * Note: SkinType doesn't have a repository, using model with scopes
     */
    public function getSkinTypes(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            // Using model directly as no repository exists - acceptable for simple read operations with scopes
            $skinTypes = \App\Models\SkinType::active()
                ->ordered()
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'skin_types' => \App\Http\Resources\Api\V1\SkinTypeResource::collection($skinTypes),
                ]
            ]);
        });
    }

    /**
     * Get all active body parts for patient information
     * Note: BodyPart doesn't have a repository, using model with scopes
     */
    public function getBodyParts(Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($request) {
            // Using model directly as no repository exists - acceptable for simple read operations with scopes
            $bodyParts = \App\Models\BodyPart::active()
                ->ordered()
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'body_parts' => \App\Http\Resources\Api\V1\BodyPartResource::collection($bodyParts),
                ]
            ]);
        });
    }

    public function getTreatmentRecords(int $id, Request $request): JsonResponse
    {
        return $this->withTransaction(function () use ($id, $request) {
            $user = $request->user();
            $booking = $this->bookingRepository->findBy(['id' => $id, 'user_id' => $user->id]);

            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => __('common.booking_not_found'),
                ], 404);
            }

            // Get treatment records from booking
            $records = $booking->treatmentRecords ?? collect([]);

            return response()->json([
                'success' => true,
                'data' => [
                    'treatment_records' => $records,
                ]
            ]);
        });
    }


}
