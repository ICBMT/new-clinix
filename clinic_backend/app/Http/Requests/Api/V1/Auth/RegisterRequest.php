<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Models\User;
use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', new KuwaitPhone(), 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'device_token' => ['nullable', 'string'],
            'device_type' => ['nullable', 'string', 'in:android,ios'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('common.auth_name_required'),
            'email.required' => __('common.auth_email_required'),
            'email.email' => __('common.auth_email_invalid'),
            'email.unique' => __('common.auth_email_unique'),
            'phone.required' => __('common.auth_phone_required'),
            'phone.unique' => __('common.auth_phone_unique'),
            'password.required' => __('common.auth_password_required'),
            'password.confirmed' => __('common.auth_password_confirmed'),
            'device_type.in' => __('common.auth_device_type_invalid'),
        ];
    }
}
