<?php

namespace App\Http\Requests\Dashboard;

use App\Models\User;
use App\Rules\KuwaitPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required', 
                'string', 
                'max:255',
                'regex:/^[\p{L}\p{M}\s\-\'\.]+$/u', // Allow letters, marks, spaces, hyphens, apostrophes, and periods
            ],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],

            'phone' => [
                'nullable',
                'string',
                new KuwaitPhone(),
                Rule::unique(User::class, 'phone')->ignore($this->user()->id),
            ],
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
        ];
    }
}

