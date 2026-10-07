<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class RescheduleAllSessionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sessions' => ['required', 'array', 'min:1'],
            'sessions.*.slot_date' => ['required', 'date', 'after_or_equal:today'],
            'sessions.*.slot_time' => ['required', 'date_format:H:i'],
            'sessions.*.treatment_slot_id' => ['nullable', 'integer', 'exists:treatment_slots,id'],
            'reschedule_reason_id' => ['nullable', 'integer', 'exists:booking_reasons,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'sessions.required' => __('common.sessions_required'),
            'sessions.array' => __('common.sessions_must_be_array'),
            'sessions.*.slot_date.required' => __('common.slot_date_required'),
            'sessions.*.slot_date.after_or_equal' => __('common.slot_date_after_today'),
            'sessions.*.slot_time.required' => __('common.slot_time_required'),
            'sessions.*.slot_time.date_format' => __('common.slot_time_format'),
            'sessions.*.treatment_slot_id.exists' => __('common.treatment_slot_not_found'),
        ];
    }
}

