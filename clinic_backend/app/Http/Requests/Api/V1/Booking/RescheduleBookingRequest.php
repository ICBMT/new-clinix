<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class RescheduleBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'treatment_slot_id' => ['nullable', 'integer', 'exists:treatment_slots,id'],
            'slot_date' => ['required', 'date', 'after_or_equal:today'],
            'slot_time' => ['required', 'date_format:H:i'],
            'reschedule_reason_id' => ['nullable', 'integer', 'exists:booking_reasons,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'treatment_slot_id.required' => __('common.treatment_slot_required'),
            'treatment_slot_id.exists' => __('common.treatment_slot_not_found'),
            'slot_date.required' => __('common.slot_date_required'),
            'slot_date.after_or_equal' => __('common.slot_date_after_today'),
            'slot_time.required' => __('common.slot_time_required'),
            'slot_time.date_format' => __('common.slot_time_format'),
        ];
    }
}


