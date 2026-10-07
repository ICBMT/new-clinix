<?php

namespace App\Http\Requests\Api\V1\Profile;

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
            'phone' => ['sometimes', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'default_language' => ['sometimes', 'string', 'in:en,ar'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'blood_type' => ['nullable', 'string'],
            'medical_history' => ['nullable', 'array'],
            'allergies' => ['nullable', 'array'],
            'current_medications' => ['nullable', 'array'],
            'skin_type' => ['nullable', 'string'],
            'medical_conditions' => ['nullable', 'array'],
            'last_machine_used' => ['nullable', 'string', 'max:255'],
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
            'gender.in' => __('common.gender_invalid'),
            'date_of_birth.date' => __('common.date_of_birth_invalid'),
            'date_of_birth.before' => __('common.date_of_birth_before_today'),
            'avatar.image' => __('common.avatar_must_be_image'),
            'avatar.max' => __('common.avatar_max_size'),
        ];
    }
}


