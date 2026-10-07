<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class CancelBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cancellation_reason' => ['nullable', 'string'],
            'cancellation_reason_id' => ['nullable', 'integer', 'exists:booking_reasons,id'],
            'machine_id' => ['nullable', function ($attribute, $value, $fail) {
                if ($value !== null && !\App\Models\Machine::where('id', $value)->exists()) {
                    $fail(__('validation.exists', ['attribute' => $attribute]));
                }
            }],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'patient_name' => ['nullable', 'string', 'max:255'],
            'patient_phone' => ['nullable', 'string'],
            'patient_age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'patient_gender' => ['nullable', 'string', 'in:male,female,other'],
        ];
    }

    public function messages(): array
    {
        return [
            'cancellation_reason.string' => __('common.cancellation_reason_invalid'),
        ];
    }
}


