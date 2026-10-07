<?php

namespace App\Http\Requests\Api\V1\Payment;

use Illuminate\Foundation\Http\FormRequest;

class ExecutePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'payment_method' => ['nullable', 'string', 'in:wallet,myfatoorah'],
            'payment_method_id' => ['required_if:payment_method,myfatoorah', 'integer', 'exists:payment_methods,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'booking_id.required' => __('common.booking_id_required'),
            'booking_id.exists' => __('common.booking_not_found'),
            'payment_method_id.required' => __('common.payment_method_id_required'),
        ];
    }
}
