<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', new KuwaitPhone()],
            'otp' => ['required', 'string', 'min:4', 'max:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => __('common.auth_phone_required'),
            'otp.required' => __('common.auth_otp_required'),
            'otp.min' => __('common.auth_otp_min'),
            'otp.max' => __('common.auth_otp_max'),
        ];
    }
}
