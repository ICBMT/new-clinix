<?php

namespace App\Http\Requests\Api\V1\User;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'lowercase', 'email:rfc,dns', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['sometimes', 'string', new KuwaitPhone(), Rule::unique('users')->ignore($user->id)],
            'default_language' => ['sometimes', 'string', 'in:en,ar'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'blood_type' => ['nullable', 'string'],
            'medical_history' => ['nullable', 'array'],
            'allergies' => ['nullable', 'array'],
            'current_medications' => ['nullable', 'array'],
            'skin_type' => ['nullable', 'string', 'in:fair,wheatish,bronze,medium_brown,black,normal,oily,dry,combination,sensitive,medium,dark'],
            'medical_conditions' => ['nullable', 'array'],
            'last_machine_used' => ['nullable', 'array'],
            'last_machine_used.*' => ['nullable', 'integer', 'exists:machines,id'],
            'last_machine_used_name' => ['nullable', 'string', 'max:255'],
            'restricted_machines' => ['nullable', 'array'],
            'restricted_machines.*' => ['nullable', 'integer', 'exists:machines,id'],
            'restricted_machines_name' => ['nullable', 'string', 'max:255'],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:255'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => __('common.name_max_length'),
            'email.email' => __('common.email_invalid'),
            'email.unique' => __('common.email_already_taken'),
            'phone.unique' => __('common.phone_already_taken'),
            'default_language.in' => __('common.language_invalid'),
            'last_machine_used.array' => __('common.last_machine_used_must_be_array'),
            'last_machine_used.*.integer' => __('common.last_machine_used_ids_must_be_integers'),
            'last_machine_used.*.exists' => __('common.machine_not_found'),
            'last_machine_used_name.string' => __('common.last_machine_used_name_must_be_string'),
            'last_machine_used_name.max' => __('common.last_machine_used_name_max_length'),
            'restricted_machines.array' => __('common.restricted_machines_must_be_array'),
            'restricted_machines.*.integer' => __('common.restricted_machines_ids_must_be_integers'),
            'restricted_machines.*.exists' => __('common.machine_not_found'),
            'restricted_machines_name.string' => __('common.restricted_machines_name_must_be_string'),
            'restricted_machines_name.max' => __('common.restricted_machines_name_max_length'),
        ];
    }
}
