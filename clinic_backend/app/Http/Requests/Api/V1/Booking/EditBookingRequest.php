<?php

namespace App\Http\Requests\Api\V1\Booking;

use Illuminate\Foundation\Http\FormRequest;

class EditBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'machine_id' => ['nullable', 'integer', 'exists:machines,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'special_instructions' => ['nullable', 'string', 'max:2000'],
            'patient_name' => ['nullable', 'string', 'max:255'],
            'patient_phone' => ['nullable', 'string', 'max:20'],
            'patient_age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'patient_gender' => ['nullable', 'string', 'in:male,female,other'],
            'patient_skin_type_id' => ['nullable', 'integer', 'exists:skin_types,id'],
            'patient_body_part_id' => ['nullable', 'integer', 'exists:body_parts,id'],
            'medical_record_ids' => ['nullable', 'array'],
            'medical_record_ids.*' => ['integer', 'exists:media,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'machine_id.exists' => __('common.machine_not_found'),
        ];
    }
}

