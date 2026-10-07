<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AdminUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('admins.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $adminId = $this->route('admin');

        // Get available role names from database (excluding system roles, clinic, and clinic_manager)
        $availableRoleNames = \App\Models\Role::whereNotIn('name', ['user', 'guest', 'super-admin', 'clinic', 'clinic_manager'])
            ->pluck('name')
            ->toArray();

        return [
            'name' => ['required', 'string', 'max:30'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($adminId)],
            'phone' => ['required', 'string', new KuwaitPhone(), Rule::unique('users', 'phone')->ignore($adminId)],
            'password' => ['nullable', 'string', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
            'role' => ['required', 'string', 'in:' . implode(',', $availableRoleNames)],
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
            'role' => __('common.role'),
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'phone.unique' => __('common.phone_already_taken'),
            'email.unique' => __('common.email_already_taken'),
            'name.max' => __('common.name_max_length'),
            'password.confirmed' => __('common.password_confirmed'),
            'password.min' => __('common.password_min_length'),
            'password.mixed' => __('common.password_must_contain_uppercase_lowercase'),
            'password.numbers' => __('common.password_must_contain_numbers'),
            'password.symbols' => __('common.password_must_contain_symbols'),
            'role.required' => __('common.role_required'),
            'role.in' => __('common.role_invalid'),
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Move password.confirmed error to password_confirmation field
            // Laravel's confirmed rule adds error to password field, we want it on password_confirmation
            $confirmationMessage = __('common.password_confirmed');
            
            // Check if password field has errors
            if ($validator->errors()->has('password')) {
                $passwordErrors = $validator->errors()->get('password');
                $remainingErrors = [];
                $confirmationError = null;
                
                // Separate confirmation error from other password errors
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
                
                // If we found a confirmation error, move it to password_confirmation
                if ($confirmationError) {
                    // Update password errors (remove confirmation, keep others)
                    if (empty($remainingErrors)) {
                        $validator->errors()->forget('password');
                    } else {
                        $validator->errors()->set('password', $remainingErrors);
                    }
                    
                    // Add to password_confirmation field
                    $validator->errors()->add('password_confirmation', $confirmationError);
                }
            }
        });
    }
}
