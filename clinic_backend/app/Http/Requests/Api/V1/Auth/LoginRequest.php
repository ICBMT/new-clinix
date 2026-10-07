<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\KuwaitPhone;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', new KuwaitPhone()],
            'password' => ['required', 'string', 'min:8'],
            'device_token' => ['nullable', 'string'],
            'device_type' => ['nullable', 'string', 'in:android,ios'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => __('common.auth_phone_required'),
            'password.required' => __('common.auth_password_required'),
            'password.min' => __('common.auth_password_min'),
            'device_type.in' => __('common.auth_device_type_invalid'),
        ];
    }
}
