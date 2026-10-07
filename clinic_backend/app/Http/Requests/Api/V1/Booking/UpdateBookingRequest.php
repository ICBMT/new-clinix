<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'treatment_id' => ['sometimes', 'integer', 'exists:treatments,id'],
            'machine_id' => ['nullable', 'integer', 'exists:machines,id'],
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'total_sessions' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['sometimes', 'numeric', 'min:0'],
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
        ];
    }

    public function messages(): array
    {
        return [
            'booking_date.after' => __('common.booking_date_after_today'),
            'start_time.date_format' => __('common.start_time_format'),
            'end_time.after' => __('common.end_time_after_start'),
        ];
    }
}


