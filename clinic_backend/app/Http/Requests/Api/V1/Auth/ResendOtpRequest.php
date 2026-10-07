<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;

class ResendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', new KuwaitPhone()],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => __('common.auth_phone_required'),
        ];
    }
}
