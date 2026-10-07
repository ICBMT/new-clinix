<?php

namespace App\Http\Requests;

use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;

class ContactFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', new KuwaitPhone()],
            'message' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => __('common.name_required'),
            'full_name.max' => __('common.name_max_length'),
            'email.required' => __('common.email_required'),
            'email.email' => __('common.email_invalid'),
            'phone.required' => __('common.phone_required'),
            'phone.regex' => __('common.phone_invalid_format'),
            'phone.max' => __('common.phone_max_length'),
            'message.required' => __('common.message_required'),
            'message.max' => __('common.message_max_length'),
        ];
    }
}

