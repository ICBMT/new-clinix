<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => __('common.auth_current_password_required'),
            'current_password.current_password' => __('common.auth_current_password_incorrect'),
            'password.required' => __('common.auth_password_required'),
            'password.confirmed' => __('common.auth_password_confirmed'),
        ];
    }
}
