<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', new KuwaitPhone()],
            'security_token' => ['required', 'string', 'min:64'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => __('common.auth_phone_required'),
            'security_token.required' => __('common.auth_reset_security_token_required'),
            'security_token.min' => __('common.auth_reset_security_token_min'),
            'password.required' => __('common.auth_password_required'),
            'password.confirmed' => __('common.auth_password_confirmed'),
        ];
    }
}
