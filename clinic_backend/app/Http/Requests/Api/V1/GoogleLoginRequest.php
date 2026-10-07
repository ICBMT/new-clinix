<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class GoogleLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'device_type' => ['nullable', 'string', 'in:android,ios'],
            'device_token' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => __('common.auth_google_token_required'),
            'device_type.in' => __('common.auth_device_type_invalid'),
        ];
    }
}
