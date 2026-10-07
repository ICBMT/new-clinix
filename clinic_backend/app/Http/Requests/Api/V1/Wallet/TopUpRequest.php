<?php

namespace App\Http\Requests\Api\V1\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class TopUpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.001'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => __('common.amount_required'),
            'amount.numeric' => __('common.amount_numeric'),
            'amount.min' => __('common.amount_min'),
            'payment_method_id.required' => __('common.payment_method_required'),
            'payment_method_id.exists' => __('common.payment_method_not_found'),
        ];
    }
}
