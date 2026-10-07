<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string'],
            'cancellation_reason' => ['nullable', 'string'],
            'rejection_reason' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => __('common.status_required'),
            'status.in' => __('common.status_invalid'),
        ];
    }
}


