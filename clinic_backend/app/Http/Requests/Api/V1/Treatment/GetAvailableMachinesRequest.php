<?php

namespace App\Http\Requests\Api\V1\Treatment;

use Illuminate\Foundation\Http\FormRequest;

class GetAvailableMachinesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'treatment_id' => ['required', 'integer', 'exists:treatments,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'treatment_id.required' => __('common.treatment_id_required'),
            'treatment_id.exists' => __('common.treatment_not_found'),
            'date.required' => __('common.date_required'),
            'date.date' => __('common.date_must_be_today_or_future'),
            'date.after_or_equal' => __('common.date_must_be_today_or_future'),
        ];
    }
}

