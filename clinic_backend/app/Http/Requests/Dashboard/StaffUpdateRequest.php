<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StaffUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('clinics-staff.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $staffId = $this->route('staff');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($staffId)],
            'phone' => ['nullable', 'string', new KuwaitPhone()],
            'password' => ['nullable', 'string', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
            'status' => ['required', 'in:active,inactive'],
            'owner_id' => ['required', 'integer', 'exists:users,id'],
            'clinic_ids' => ['required', 'array', 'min:1'],
            'clinic_ids.*' => ['exists:clinics,id'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => __('common.name'),
            'email' => __('common.email'),
            'phone' => __('common.phone'),
            'password' => __('common.password'),
            'status' => __('common.status'),
            'owner_id' => __('common.clinic_owner'),
            'clinic_ids' => __('common.clinic_ids'),
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => __('common.name_required'),
            'email.unique' => __('common.email_already_taken'),
            'email.required' => __('common.email_required'),
            'email.email' => __('common.api_email_invalid_format'),
            'password.confirmed' => __('common.password_confirmed'),
            'password.min' => __('common.password_min_length'),
            'password.mixed' => __('common.password_must_contain_uppercase_lowercase'),
            'password.numbers' => __('common.password_must_contain_numbers'),
            'password.symbols' => __('common.password_must_contain_symbols'),
            'owner_id.required' => __('common.owner_id_required'),
            'owner_id.exists' => __('common.owner_id_invalid'),
            'clinic_ids.required' => __('common.clinic_ids_required'),
            'clinic_ids.array' => __('common.clinic_ids_must_be_array'),
            'clinic_ids.min' => __('common.clinic_ids_min_one'),
            'clinic_ids.*.exists' => __('common.clinic_ids_invalid'),
            'status.required' => __('common.status_required'),
            'status.in' => __('common.status_invalid'),
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Move password.confirmed error to password_confirmation field
            $confirmationMessage = __('common.password_confirmed');
            
            if ($validator->errors()->has('password')) {
                $passwordErrors = $validator->errors()->get('password');
                $remainingErrors = [];
                $confirmationError = null;
                
                foreach ($passwordErrors as $error) {
                    if (is_string($error) && (
                        stripos($error, 'confirmation') !== false || 
                        $error === $confirmationMessage
                    )) {
                        $confirmationError = $error;
                    } else {
                        $remainingErrors[] = $error;
                    }
                }
                
                if ($confirmationError) {
                    $validator->errors()->forget('password');
                    
                    // Add back remaining password errors (non-confirmation errors)
                    foreach ($remainingErrors as $error) {
                        $validator->errors()->add('password', $error);
                    }
                    
                    $validator->errors()->add('password_confirmation', $confirmationError);
                }
            }
        });
    }
}

