<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'treatment_id' => ['required_without:service_id', 'integer', 'exists:treatments,id'],
            'service_id' => ['required_without:treatment_id', 'integer', 'exists:treatments,id'], // Backward compatibility
            'clinic_id' => ['required_without:vendor_id', 'integer', 'exists:clinics,id'],
            'vendor_id' => ['required_without:clinic_id', 'integer', 'exists:clinics,id'], // Backward compatibility
            'machine_id' => ['nullable', 'integer', 'exists:machines,id'],
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'total_sessions' => ['required', 'integer', 'min:1'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'], // Optional - duration comes from treatment
            'sessions' => ['required', 'array', 'min:1'],
            'sessions.*.slot_date' => ['required', 'date', 'after_or_equal:today'],
            'sessions.*.slot_time' => ['required', 'date_format:H:i'],
            'sessions.*.treatment_slot_id' => ['nullable', 'integer', 'exists:treatment_slots,id'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'payment_type' => ['nullable', 'string'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'balance_amount' => ['nullable', 'numeric', 'min:0'],
            'balance_due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'special_instructions' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'cancellation_reason' => ['nullable', 'string'],
            'rejection_reason' => ['nullable', 'string'],
            'medical_notes' => ['nullable', 'string'],
            'medical_questionnaire' => ['nullable', 'array'],
            'medical_record_ids' => ['nullable', 'array'],
            'medical_record_ids.*' => ['integer', 'exists:media,id'],
            // Patient data (patient_id not stored, always uses auth user - no validation needed)
            'patient_name' => ['nullable', 'string', 'max:255'],
            'patient_phone' => ['nullable', 'string', 'max:20'],
            'patient_age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'patient_gender' => ['nullable', 'string', 'in:male,female,other'],
            'patient_skin_type_id' => ['nullable', 'integer', 'exists:skin_types,id'],
            'patient_body_part_id' => ['nullable', 'integer', 'exists:body_parts,id'],
            // Booking documents - can include medical records and uploaded documents
            'booking_document_ids' => ['nullable', 'array'],
            'booking_document_ids.*' => ['integer', 'exists:media,id'],
            // New document uploads
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'], // 10MB max
        ];

        // Add max validation for total_sessions based on treatment's max_sessions
        $treatmentId = $this->input('treatment_id') ?? $this->input('service_id');
        if ($treatmentId) {
            $treatment = \App\Models\Treatment::find($treatmentId);
            if ($treatment && $treatment->max_sessions) {
                $rules['total_sessions'][] = 'max:' . $treatment->max_sessions;
            } else {
                // Default max of 5 if no max_sessions is set
                $rules['total_sessions'][] = 'max:5';
            }
        } else {
            // Default max of 5 if treatment_id is not provided yet
            $rules['total_sessions'][] = 'max:5';
        }

        return $rules;
    }

    public function messages(): array
    {
        $treatmentId = $this->input('treatment_id') ?? $this->input('service_id');
        $maxSessions = 5;
        if ($treatmentId) {
            $treatment = \App\Models\Treatment::find($treatmentId);
            if ($treatment && $treatment->max_sessions) {
                $maxSessions = $treatment->max_sessions;
            }
        }

        return [
            'treatment_id.required_without' => __('common.treatment_id_required'),
            'treatment_id.exists' => __('common.treatment_not_found'),
            'service_id.required_without' => __('common.treatment_id_required'),
            'service_id.exists' => __('common.treatment_not_found'),
            'clinic_id.required_without' => __('common.clinic_id_required'),
            'clinic_id.exists' => __('common.clinic_not_found'),
            'vendor_id.required_without' => __('common.clinic_id_required'),
            'vendor_id.exists' => __('common.clinic_not_found'),
            'booking_date.required' => __('common.booking_date_required'),
            'booking_date.after' => __('common.booking_date_after_today'),
            'start_time.required' => __('common.start_time_required'),
            'start_time.date_format' => __('common.start_time_format'),
            'end_time.after' => __('common.end_time_after_start'),
            'total_amount.required' => __('common.total_amount_required'),
            'payment_method.in' => __('common.payment_method_invalid'),
            'total_sessions.max' => __('common.total_sessions_exceeds_max', ['max' => $maxSessions]),
        ];
    }
}


