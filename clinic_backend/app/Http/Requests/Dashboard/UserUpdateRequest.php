<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class UserUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('users.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->route('user');
        $userId = is_object($user) ? $user->id : (int) $user;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:50', 'regex:/^[\p{L}\s]+$/u'],
            'email' => [
                'sometimes',
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                new KuwaitPhone(),
                Rule::unique('users', 'phone')->ignore($userId),
            ],
            'password' => ['nullable', 'string', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
            'email_verified_at' => ['nullable', 'date'],
            'phone_verified_at' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female'],
            'skin_type' => ['nullable', 'string', 'in:fair,medium,dark'],
            'date_of_birth' => ['nullable', 'date', 'before:today', 'before_or_equal:' . now()->subYears(18)->format('Y-m-d')],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'last_machine_used' => ['nullable', 'array'],
            'last_machine_used.*' => ['nullable', 'integer', 'exists:machines,id'],
            'last_machine_used_name' => ['nullable', 'string', 'max:255'],
            'restricted_machines' => ['nullable', 'array'],
            'restricted_machines.*' => ['nullable', 'integer', 'exists:machines,id'],
            'restricted_machines_name' => ['nullable', 'string', 'max:255'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'medications' => ['nullable', 'string', 'max:1000'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'remove_avatar' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => __('common.full_name'),
            'email' => __('common.email'),
            'phone' => __('common.phone_number'),
            'password' => __('common.password'),
            'gender' => __('common.gender'),
            'skin_type' => __('common.skin_type'),
            'date_of_birth' => __('common.date_of_birth'),
            'age' => __('common.age'),
            'last_machine_used' => __('common.last_machine_used'),
            'last_machine_used_name' => __('common.last_machine_used_name'),
            'restricted_machines' => __('common.restricted_machines'),
            'restricted_machines_name' => __('common.restricted_machines_name'),
            'allergies' => __('common.allergies'),
            'medications' => __('common.medications'),
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
            'name.regex' => __('common.name_must_be_alphabetic'),
            'name.max' => __('common.name_max_50_characters'),
            'password.min' => __('common.password_min_8_characters'),
            'password.mixed' => __('common.password_must_contain_uppercase_lowercase'),
            'password.numbers' => __('common.password_must_contain_numbers'),
            'password.symbols' => __('common.password_must_contain_symbols'),
            'date_of_birth.before_or_equal' => __('common.age_must_be_18_years_old'),
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->has('date_of_birth') && $this->date_of_birth) {
                $birthDate = \Carbon\Carbon::parse($this->date_of_birth);
                $age = $birthDate->diffInYears(now());
                
                if ($age < 18) {
                    $validator->errors()->add(
                        'date_of_birth',
                        __('common.age_must_be_18_years_old')
                    );
                }
            }
        });
    }
}


