<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'payment_method_id' => ['nullable', 'string', 'max:255'],
            'payment_method_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'payment_method_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'payment_method_code' => ['nullable', 'string', 'max:50'],
            'is_direct_payment' => ['sometimes', 'boolean'],
            'service_charge' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'total_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'currency_iso' => ['nullable', 'string', 'size:3'],
            'image' => ['sometimes', 'image', 'max:2048', 'mimes:jpg,jpeg,png'],
            'is_embedded_supported' => ['sometimes', 'boolean'],
            'payment_currency_iso' => ['nullable', 'string', 'size:3'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'is_ios_supported' => ['sometimes', 'boolean'],
            'is_android_supported' => ['sometimes', 'boolean'],
            'is_web_supported' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'payment_method_ar.required' => __('validation.required', ['attribute' => __('common.name_ar')]),
            'payment_method_en.required' => __('validation.required', ['attribute' => __('common.name_en')]),
            'status.required' => __('validation.required', ['attribute' => __('common.status')]),
            'status.in' => __('validation.in', ['attribute' => __('common.status')]),
        ];
    }
}

