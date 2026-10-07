<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class PatientDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', 'integer', 'exists:users,id'],
            'patient_name' => ['required_without:patient_id', 'string', 'max:255'],
            'patient_phone' => ['required_without:patient_id', 'string', 'max:20'],
            'patient_age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'patient_gender' => ['nullable', 'string', 'in:male,female,other'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.exists' => __('common.patient_not_found'),
            'patient_name.required_without' => __('common.patient_name_required'),
            'patient_phone.required_without' => __('common.patient_phone_required'),
            'patient_age.integer' => __('common.patient_age_invalid'),
            'patient_gender.in' => __('common.patient_gender_invalid'),
        ];
    }
}

