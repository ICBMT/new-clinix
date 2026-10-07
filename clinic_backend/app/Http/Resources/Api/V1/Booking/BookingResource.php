<?php

namespace App\Http\Resources\Api\V1\Booking;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentSlotResource;
use App\Http\Resources\Api\V1\Machine\MachineResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentResource;
use App\Http\Resources\Api\V1\Clinic\ClinicResource;
use App\Http\Resources\Api\V1\Profile\AddressResource;
use App\Http\Resources\Api\V1\Auth\UserResource;
use Illuminate\Http\Request;

class BookingResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_reference' => $this->booking_reference,
            'user_id' => $this->user_id,
            'clinic_id' => $this->clinic_id,
            'treatment_id' => $this->treatment_id,
            'machine_id' => $this->machine_id,
            'total_sessions' => $this->total_sessions ?? 1,
            'base_price' => $this->base_price ? (float) $this->base_price : null,
            'subtotal' => $this->subtotal ? (float) $this->subtotal : null,
            'tax_amount' => $this->tax_amount ? (float) $this->tax_amount : null,
            'total_amount' => $this->total_amount ? (float) $this->total_amount : null,
            'currency' => $this->currency,
            'payment_type' => $this->payment_type,
            'deposit_amount' => $this->deposit_amount ? (float) $this->deposit_amount : null,
            'balance_amount' => $this->balance_amount ? (float) $this->balance_amount : null,
            'balance_due_date' => $this->balance_due_date?->toDateString(),
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'special_instructions' => $this->special_instructions,
            'notes' => $this->notes,
            'cancellation_reason' => $this->when($this->cancellation_reason || $this->cancellation_reason_id, function () {
                // If reason_id exists and relationship is loaded, get the localized text from the relationship
                if ($this->relationLoaded('cancellationReason') && $this->cancellationReason) {
                    return $this->cancellationReason->localized('title');
                }
                // Otherwise return the stored text (which was set from reason if reason_id was provided)
                return $this->cancellation_reason;
            }),
            'reschedule_reason' => $this->when($this->reschedule_reason || $this->reschedule_reason_id, function () {
                // If reason_id exists and relationship is loaded, get the localized text from the relationship
                if ($this->relationLoaded('rescheduleReason') && $this->rescheduleReason) {
                    return $this->rescheduleReason->localized('title');
                }
                // Otherwise return the stored text (which was set from reason if reason_id was provided)
                return $this->reschedule_reason;
            }),
            'rejection_reason' => $this->rejection_reason,
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'rejected_at' => $this->rejected_at?->toISOString(),
            'medical_notes' => $this->medical_notes,
            'medical_questionnaire' => $this->medical_questionnaire ?? [],
            'follow_up_booking_id' => $this->follow_up_booking_id,
            'reschedule_count' => $this->reschedule_count ?? 0,
            'cancellation_count' => $this->cancellation_count ?? 0,
            'documents_count' => $this->documents_count ?? 0,
            'payment_transaction_id' => $this->payment_transaction_id,
            'payment_gateway' => $this->payment_gateway,
            'refund_amount' => $this->refund_amount ? (float) $this->refund_amount : null,
            'refund_reason' => $this->refund_reason,
            'refunded_at' => $this->refunded_at?->toISOString(),
            'booking_source' => $this->booking_source,
            'internal_notes' => $this->internal_notes,
            'is_reminder_sent' => $this->is_reminder_sent ?? false,
            'reminder_sent_at' => $this->reminder_sent_at?->toISOString(),
            'is_review_provided' => $this->is_review_provided ?? false,
            'review_provided_at' => $this->review_provided_at?->toISOString(),
            'can_review' => $this->canReview($request),
            'duration_minutes' => $this->whenLoaded('treatment', function () {
                return $this->treatment->service_duration_minutes ?? 60;
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Patient data - get from booking fields or fallback to user
            'patient' => $this->when(true, function () {
                // Use stored patient data if available, otherwise use user data
                $name = $this->patient_name;
                $phone = $this->patient_phone;
                $age = $this->patient_age;
                $gender = $this->patient_gender;
                $skinType = null;
                $bodyPart = null;
                
                // Get skin type from relationship if loaded
                if ($this->relationLoaded('patientSkinType') && $this->patientSkinType) {
                    $skinType = [
                        'id' => $this->patientSkinType->id,
                        'name' => $this->localized('name', null, $this->patientSkinType),
                    ];
                } elseif ($this->patient_skin_type_id) {
                    // Load skin type if not already loaded
                    $skinTypeModel = \App\Models\SkinType::find($this->patient_skin_type_id);
                    if ($skinTypeModel) {
                        $skinType = [
                            'id' => $skinTypeModel->id,
                            'name' => $this->localized('name', null, $skinTypeModel),
                        ];
                    }
                }
                
                // Get body part from relationship if loaded
                if ($this->relationLoaded('patientBodyPart') && $this->patientBodyPart) {
                    $bodyPart = [
                        'id' => $this->patientBodyPart->id,
                        'name' => $this->localized('name', null, $this->patientBodyPart),
                    ];
                } elseif ($this->patient_body_part_id) {
                    // Load body part if not already loaded
                    $bodyPartModel = \App\Models\BodyPart::find($this->patient_body_part_id);
                    if ($bodyPartModel) {
                        $bodyPart = [
                            'id' => $bodyPartModel->id,
                            'name' => $this->localized('name', null, $bodyPartModel),
                        ];
                    }
                }
                
                // Fallback to user data if patient fields are empty
                if ($this->relationLoaded('user') && $this->user) {
                    $name = $name ?? $this->user->name;
                    $phone = $phone ?? $this->user->phone;
                    $age = $age ?? ($this->user->date_of_birth ? now()->diffInYears($this->user->date_of_birth) : null);
                    $gender = $gender ?? $this->user->gender;
                    
                    // Fallback to user's skin_type if not set in booking
                    if (!$skinType && $this->user->skin_type) {
                        $userSkinType = \App\Models\SkinType::where('name_en', $this->user->skin_type)
                            ->orWhere('name_ar', $this->user->skin_type)
                            ->first();
                        if ($userSkinType) {
                            $skinType = [
                                'id' => $userSkinType->id,
                                'name' => $this->localized('name', null, $userSkinType),
                            ];
                        }
                    }
                }
                
                return [
                    'id' => $this->user_id,
                    'name' => $name,
                    'phone' => $phone,
                    'age' => $age,
                    'gender' => $gender,
                    'skin_type' => $skinType,
                    'body_part' => $bodyPart,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                $address = null;
                if ($this->user->relationLoaded('addresses') && $this->user->addresses && $this->user->addresses->isNotEmpty()) {
                    $firstAddress = $this->user->addresses->first();
                    $addressParts = array_filter([
                        $firstAddress->address_line_1 ?? null,
                        $firstAddress->address_line_2 ?? null,
                        $firstAddress->city ?? null,
                        $firstAddress->state ?? null,
                        $firstAddress->country ?? null,
                    ]);
                    $address = !empty($addressParts) ? implode(', ', $addressParts) : null;
                }
                
                // Calculate age from date_of_birth
                $age = null;
                $ageFormatted = null;
                $dateOfBirth = null;
                
                if ($this->user->date_of_birth) {
                    $dateOfBirth = $this->user->date_of_birth->format('Y-m-d');
                    $age = now()->diffInYears($this->user->date_of_birth);
                    $ageFormatted = $age . ' ' . __('common.years_old');
                }
                
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email ?? null,
                    'phone' => $this->user->phone ?? null,
                    'address' => $address,
                    'date_of_birth' => $dateOfBirth,
                    'age' => $age,
                    'age_formatted' => $ageFormatted,
                ];
            }),
            'clinic' => $this->whenLoaded('clinic', function () {
                $name = $this->localized('name', null, $this->clinic);
                
                // Get governorate and area names
                $governorateName = null;
                $areaName = null;
                
                if ($this->clinic->relationLoaded('governorate') && $this->clinic->governorate) {
                    $governorateName = $this->localized('name', null, $this->clinic->governorate);
                }
                
                if ($this->clinic->relationLoaded('area') && $this->clinic->area) {
                    $areaName = $this->localized('name', null, $this->clinic->area);
                }
                
                // Build full address from all components
                $addressParts = [];
                
                // Start with main address if available
                if ($this->clinic->address) {
                    $addressParts[] = $this->clinic->address;
                }
                
                // Add block, street, avenue
                if ($this->clinic->block) {
                    $addressParts[] = __('common.address_block') . $this->clinic->block;
                }
                if ($this->clinic->street) {
                    $addressParts[] = $this->clinic->street . ' ' . __('common.street');
                }
                if ($this->clinic->avenue) {
                    $addressParts[] = $this->clinic->avenue . ' ' . __('common.avenue');
                }
                
                // Add house, floor, apt
                if ($this->clinic->house) {
                    $houseInfo = __('common.address_house') . $this->clinic->house;
                    if ($this->clinic->floor) {
                        $houseInfo .= __('common.address_floor_comma') . $this->clinic->floor;
                    }
                    if ($this->clinic->apt) {
                        $houseInfo .= __('common.address_apt') . $this->clinic->apt;
                    }
                    $addressParts[] = $houseInfo;
                } elseif ($this->clinic->floor) {
                    $addressParts[] = __('common.address_floor') . $this->clinic->floor;
                }
                
                // Add area and governorate
                if ($areaName) {
                    $addressParts[] = $areaName;
                }
                if ($governorateName) {
                    $addressParts[] = $governorateName;
                }
                
                // Add city, state, country
                if ($this->clinic->city) {
                    $addressParts[] = $this->clinic->city;
                }
                if ($this->clinic->state) {
                    $addressParts[] = $this->clinic->state;
                }
                if ($this->clinic->country) {
                    $addressParts[] = $this->clinic->country;
                }
                
                // Add postal code
                if ($this->clinic->postal_code) {
                    $addressParts[] = $this->clinic->postal_code;
                }
                
                // Join all parts with comma and space, or use the main address if no parts
                $fullAddress = !empty($addressParts) ? implode(', ', $addressParts) : ($this->clinic->address ?? '');
                
                // Get clinic logo/image from media or convert logo path to full URL
                $clinicLogo = null;
                $clinicImage = null;
                
                // Try to get from media relationship first
                // Exclude license/document collections (business_license, id_document_front, id_document_back)
                if ($this->clinic->relationLoaded('media') && $this->clinic->media->isNotEmpty()) {
                    $excludedCollections = ['business_license', 'id_document_front', 'id_document_back'];
                    $validMedia = $this->clinic->media->reject(function ($media) use ($excludedCollections) {
                        return in_array($media->collection_name, $excludedCollections);
                    });
                    
                    $logoMedia = $validMedia->where('collection_name', 'logos')->first() 
                        ?? $validMedia->where('collection_name', 'images')->first() 
                        ?? $validMedia->first();
                    if ($logoMedia) {
                        $clinicLogo = $logoMedia->file_name ?? $logoMedia->url ?? null;
                        $clinicImage = $clinicLogo;
                    }
                }
                
                // Fallback to logo field and convert to full URL
                if (!$clinicLogo && $this->clinic->logo) {
                    $logoPath = $this->clinic->logo;
                    // Convert storage path to full URL (same pattern as other resources)
                    if (str_starts_with($logoPath, 'http://') || str_starts_with($logoPath, 'https://')) {
                        $clinicLogo = $logoPath;
                    } else {
                        $clinicLogo = asset('storage/' . ltrim($logoPath, '/'));
                    }
                    $clinicImage = $clinicLogo;
                }
                
                // Get rating and total reviews (calculate on the fly if needed)
                $rating = $this->getClinicRating();
                $totalReviews = $this->getClinicTotalReviews();
                
                return [
                    'id' => $this->clinic->id,
                    'name' => $name,
                    'logo' => $clinicLogo,
                    'image' => $clinicImage,
                    'phone' => $this->clinic->phone,
                    'email' => $this->clinic->email,
                    'address' => [
                        'full_address' => $fullAddress,
                        'latitude' => $this->clinic->latitude ? (float) $this->clinic->latitude : null,
                        'longitude' => $this->clinic->longitude ? (float) $this->clinic->longitude : null,
                    ],
                    'rating' => $rating,
                    'total_reviews' => $totalReviews,
                    'cancellation_policy' => $this->getLocalizedPolicy('cancellation_policy', $this->clinic),
                    'reschedule_policy' => $this->getLocalizedPolicy('reschedule_policy', $this->clinic),
                    'refund_policy' => $this->getLocalizedPolicy('refund_policy', $this->clinic),
                ];
            }),
            'treatment' => $this->whenLoaded('treatment', function () {
                $name = $this->localized('name', null, $this->treatment);
                
                // Get treatment image from media relationship
                // According to Media model, file_name already stores the full URL
                $treatmentImage = null;
                
                // Try to get from media relationship first
                if ($this->treatment->relationLoaded('media') && $this->treatment->media->isNotEmpty()) {
                    $imageMedia = $this->treatment->media->where('collection_name', 'images')->first() 
                        ?? $this->treatment->media->where('is_primary', true)->first()
                        ?? $this->treatment->media->first();
                    
                    if ($imageMedia && $imageMedia->file_name) {
                        // file_name already contains the full URL according to Media model
                        // But ensure it's a full URL (same logic as MediaResource)
                        $imagePath = $imageMedia->file_name;
                        if ($imagePath && !str_starts_with($imagePath, 'http')) {
                            $treatmentImage = url($imagePath);
                        } else {
                            $treatmentImage = $imagePath;
                        }
                    }
                }
                
                // Fallback to image field if media not loaded or image not found
                if (!$treatmentImage && $this->treatment->image) {
                    $imagePath = $this->treatment->image;
                    // Convert to full URL if needed (same logic as MediaResource)
                    if ($imagePath && !str_starts_with($imagePath, 'http')) {
                        $treatmentImage = url($imagePath);
                    } else {
                        $treatmentImage = $imagePath;
                    }
                }
                
                return [
                    'id' => $this->treatment->id,
                    'name' => $name,
                    'image' => $treatmentImage,
                ];
            }),
            'payment_method' => $this->when(true, function () {
                // Try to get payment method details by payment_method_code or payment_gateway
                $paymentMethod = null;
                $paymentGateway = $this->payment_gateway;
                $transaction = null;
                
                // If payment_gateway is null but payment_status is paid, try to get from transaction
                if (!$paymentGateway && $this->payment_status === 'paid') {
                    // First try using the transaction relationship if loaded
                    if ($this->relationLoaded('transactions') && $this->transactions->isNotEmpty()) {
                        $transaction = $this->transactions->first();
                        if ($transaction && $transaction->payment_method) {
                            $paymentGateway = $transaction->payment_method;
                        }
                    }
                    
                    // If still not found, try querying by payment_transaction_id
                    if (!$paymentGateway && $this->payment_transaction_id) {
                        // Try to find transaction by transaction_id field first
                        $transaction = \App\Models\Transaction::where('transaction_id', $this->payment_transaction_id)
                            ->where('transactionable_type', \App\Models\Booking::class)
                            ->where('transactionable_id', $this->id)
                            ->first();
                        
                        // If not found, try by ID
                        if (!$transaction) {
                            $transaction = \App\Models\Transaction::where('id', $this->payment_transaction_id)
                                ->where('transactionable_type', \App\Models\Booking::class)
                                ->where('transactionable_id', $this->id)
                                ->first();
                        }
                        
                        // If still not found, try without transactionable constraints (broader search)
                        if (!$transaction) {
                            $transaction = \App\Models\Transaction::where('transaction_id', $this->payment_transaction_id)
                                ->orWhere('id', $this->payment_transaction_id)
                                ->first();
                        }
                        
                        if ($transaction && $transaction->payment_method) {
                            $paymentGateway = $transaction->payment_method;
                        }
                    }
                    
                    // If still not found, try to find any transaction for this booking
                    if (!$paymentGateway) {
                        if (!$transaction) {
                            $transaction = \App\Models\Transaction::where('transactionable_type', \App\Models\Booking::class)
                                ->where('transactionable_id', $this->id)
                                ->whereNotNull('payment_method')
                                ->first();
                            if ($transaction && $transaction->payment_method) {
                                $paymentGateway = $transaction->payment_method;
                            }
                        }
                        
                        // If transaction found but payment_method is null, try using type field
                        if (!$paymentGateway && $transaction && $transaction->type) {
                            $paymentGateway = $transaction->type;
                        }
                    }
                }
                
                if ($paymentGateway) {
                    // First try exact match on payment_method_code
                    $paymentMethod = \App\Models\PaymentMethod::where('payment_method_code', $paymentGateway)->first();
                    
                    // If not found, try case-insensitive match on payment_method_code
                    if (!$paymentMethod) {
                        $paymentMethod = \App\Models\PaymentMethod::whereRaw('LOWER(payment_method_code) = ?', [strtolower($paymentGateway)])->first();
                    }
                    
                    // If still not found, try matching on name fields
                    if (!$paymentMethod) {
                        $paymentMethod = \App\Models\PaymentMethod::where(function($query) use ($paymentGateway) {
                            $query->where('payment_method_en', 'like', '%' . $paymentGateway . '%')
                                  ->orWhere('payment_method_ar', 'like', '%' . $paymentGateway . '%');
                        })->first();
                    }
                }
                
                $paymentMethodName = null;
                $paymentMethodImage = null;
                
                if ($paymentMethod) {
                    $paymentMethodName = $this->localized('payment_method', null, $paymentMethod);
                    
                    // Get image_url and convert to full URL if needed
                    if ($paymentMethod->image_url) {
                        $imageUrl = $paymentMethod->image_url;
                        // If it's not already a full URL, convert it
                        if (!str_starts_with($imageUrl, 'http://') && !str_starts_with($imageUrl, 'https://')) {
                            // If it's a storage path, convert to asset URL
                            if (str_starts_with($imageUrl, 'storage/') || str_starts_with($imageUrl, 'public/')) {
                                $paymentMethodImage = asset(ltrim($imageUrl, '/'));
                            } else {
                                // Otherwise, assume it's a relative path and prepend storage
                                $paymentMethodImage = asset('storage/' . ltrim($imageUrl, '/'));
                            }
                        } else {
                            $paymentMethodImage = $imageUrl;
                        }
                    }
                } elseif ($paymentGateway) {
                    // If payment method not found but gateway exists, use gateway name
                    $paymentMethodName = $paymentGateway;
                    
                    // Try to find a payment method by common gateway names
                    $commonGateways = ['visa', 'mastercard', 'knet', 'amex', 'cash', 'credit', 'debit'];
                    foreach ($commonGateways as $common) {
                        if (stripos($paymentGateway, $common) !== false) {
                            $foundMethod = \App\Models\PaymentMethod::where(function($query) use ($common) {
                                $query->whereRaw('LOWER(payment_method_code) LIKE ?', ['%' . strtolower($common) . '%'])
                                      ->orWhereRaw('LOWER(payment_method_en) LIKE ?', ['%' . strtolower($common) . '%'])
                                      ->orWhereRaw('LOWER(payment_method_ar) LIKE ?', ['%' . strtolower($common) . '%']);
                            })
                            ->where('status', 'active')
                            ->first();
                            
                            if ($foundMethod) {
                                $paymentMethod = $foundMethod;
                                $paymentMethodName = $this->localized('payment_method', null, $foundMethod);
                                
                                if ($foundMethod->image_url) {
                                    $imageUrl = $foundMethod->image_url;
                                    if (!str_starts_with($imageUrl, 'http://') && !str_starts_with($imageUrl, 'https://')) {
                                        if (str_starts_with($imageUrl, 'storage/') || str_starts_with($imageUrl, 'public/')) {
                                            $paymentMethodImage = asset(ltrim($imageUrl, '/'));
                                        } else {
                                            $paymentMethodImage = asset('storage/' . ltrim($imageUrl, '/'));
                                        }
                                    } else {
                                        $paymentMethodImage = $imageUrl;
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
                
                // Don't return a default payment method - only return if we actually found one
                // Returning null is better than showing incorrect payment method
                
                return [
                    'id' => $paymentMethod ? $paymentMethod->id : null,
                    'name' => $paymentMethodName,
                    'image_url' => $paymentMethodImage,
                ];
            }),
            'machine' => $this->whenLoaded('machine', function () {
                return new MachineResource($this->machine);
            }),
            // Address removed from booking flow - not stored in bookings table
            // But we should still provide it if clinic relation is loaded
            'address' => $this->whenLoaded('clinic', function () use ($request) {
                // Determine if we should show full address or just area
                // For a specific booking, the user definitely has a booking (this one!), so show full address
                // However, logic might be more complex if we want to hide it until confirmed/paid
                // Based on "if i have booked any booking before then send locaiton otherwise send area name only":
                // Since this IS a booking resource, the user HAS this booking.
                // So we should show the full address here.
                
                $addressParts = [];
                if ($this->clinic->address) $addressParts[] = $this->clinic->address;
                if ($this->clinic->block) $addressParts[] = __('common.address_block') . $this->clinic->block;
                if ($this->clinic->street) $addressParts[] = $this->clinic->street;
                if ($this->clinic->house) $addressParts[] = __('common.address_house') . $this->clinic->house;
                
                $fullAddress = !empty($addressParts) ? implode(', ', $addressParts) : ($this->clinic->address ?? '');
                
                return [
                    'id' => 0, // Placeholder ID
                    'address_line_1' => $fullAddress,
                    'latitude' => $this->clinic->latitude,
                    'longitude' => $this->clinic->longitude,
                ];
            }),
            'sessions' => $this->whenLoaded('sessions', function () {
                return BookingSessionResource::collection($this->sessions);
            }),
            'next_session' => $this->whenLoaded('sessions', function () {
                $nextSession = $this->sessions
                    ->where('status', 'pending')
                    ->sortBy(function ($session) {
                        return $session->slot_date . ' ' . $session->slot_time;
                    })
                    ->first();
                
                if ($nextSession) {
                    return new BookingSessionResource($nextSession);
                }
                return null;
            }),
            'sessions_summary' => $this->whenLoaded('sessions', function () {
                $sessions = $this->sessions;
                return [
                    'total' => $sessions->count(),
                    'completed' => $sessions->where('status', 'completed')->count(),
                    'pending' => $sessions->where('status', 'pending')->count(),
                    'cancelled' => $sessions->where('status', 'cancelled')->count(),
                    'no_show' => $sessions->where('status', 'no_show')->count(),
                ];
            }),
            'documents' => $this->whenLoaded('medicalRecords', function () {
                return MediaResource::collection($this->medicalRecords);
            }, function () {
                // Fallback: if relationship not loaded, query directly using medical_record_ids
                if ($this->medical_record_ids && is_array($this->medical_record_ids) && !empty($this->medical_record_ids)) {
                    $medicalRecords = \App\Models\Media::whereIn('id', $this->medical_record_ids)
                        ->where('collection_name', 'medical-records')
                        ->get();
                    return MediaResource::collection($medicalRecords);
                }
                return [];
            }),
            'follow_up_booking' => $this->whenLoaded('followUpBooking', function () {
                return new BookingResource($this->followUpBooking);
            }),
        ];
    }

    /**
     * Check if user can review the clinic for this booking
     * User can review if they have more bookings than reviews for this clinic
     */
    protected function canReview(Request $request): bool
    {
        $user = $request->user();
        if (!$user || !$this->clinic_id) {
            return false;
        }

        // Count bookings for this user with this clinic
        $bookingsCount = \App\Models\Booking::where('user_id', $user->id)
            ->where('clinic_id', $this->clinic_id)
            ->count();

        // Count reviews for this user for this clinic
        $reviewCount = \App\Models\Review::where('user_id', $user->id)
            ->where('clinic_id', $this->clinic_id)
            ->count();

        // User can review if they have more bookings than reviews
        return $bookingsCount > $reviewCount;
    }

    /**
     * Get clinic average rating - calculate on the fly if database value is 0 or null
     */
    private function getClinicRating(): float
    {
        if (!$this->relationLoaded('clinic') || !$this->clinic) {
            return 0.0;
        }

        // Always calculate from reviews to ensure accuracy
        // Include reviews where status is 'approved' or null (for backward compatibility)
        // Exclude soft-deleted reviews (SoftDeletes trait handles this automatically)
        $averageRating = \App\Models\Review::where('clinic_id', $this->clinic->id)
            ->where(function($query) {
                $query->where('status', 'approved')
                      ->orWhereNull('status'); // Handle old reviews without status
            })
            ->whereNotNull('rating')
            ->where('rating', '>', 0)
            ->avg('rating');

        // If calculated rating exists, use it; otherwise check database value
        if ($averageRating !== null && $averageRating > 0) {
            return (float) round($averageRating, 2);
        }

        // Fallback to database value if calculation returns null/0
        if ($this->clinic->average_rating && $this->clinic->average_rating > 0) {
            return (float) $this->clinic->average_rating;
        }

        return 0.0;
    }

    /**
     * Get clinic total reviews - calculate on the fly if database value is 0 or null
     */
    private function getClinicTotalReviews(): int
    {
        if (!$this->relationLoaded('clinic') || !$this->clinic) {
            return 0;
        }

        // Always calculate from reviews to ensure accuracy
        // Include reviews where status is 'approved' or null (for backward compatibility)
        // Exclude soft-deleted reviews (SoftDeletes trait handles this automatically)
        $calculatedCount = \App\Models\Review::where('clinic_id', $this->clinic->id)
            ->where(function($query) {
                $query->where('status', 'approved')
                      ->orWhereNull('status'); // Handle old reviews without status
            })
            ->count();

        // If calculated count exists, use it; otherwise check database value
        if ($calculatedCount > 0) {
            return (int) $calculatedCount;
        }

        // Fallback to database value if calculation returns 0
        if ($this->clinic->total_reviews && $this->clinic->total_reviews > 0) {
            return (int) $this->clinic->total_reviews;
        }

        return 0;
    }

    /**
     * Get localized policy value from clinic
     * Handles both null and empty string cases
     */
    private function getLocalizedPolicy(string $policyName, $clinic): ?string
    {
        if (!$clinic) {
            return null;
        }

        $locale = app()->getLocale();
        $isArabic = $locale === 'ar';
        
        $localizedField = $policyName . ($isArabic ? '_ar' : '_en');
        $fallbackField = $policyName . ($isArabic ? '_en' : '_ar');
        
        // Get the localized value
        $localizedValue = $clinic->{$localizedField} ?? null;
        // If localized value is empty string, treat as null
        if ($localizedValue === '') {
            $localizedValue = null;
        }
        
        // If localized value exists and is not empty, return it
        if ($localizedValue !== null && $localizedValue !== '') {
            return $localizedValue;
        }
        
        // Try fallback field
        $fallbackValue = $clinic->{$fallbackField} ?? null;
        // If fallback value is empty string, treat as null
        if ($fallbackValue === '') {
            $fallbackValue = null;
        }
        
        // Return fallback if it exists, otherwise null
        return $fallbackValue !== null && $fallbackValue !== '' ? $fallbackValue : null;
    }
}
