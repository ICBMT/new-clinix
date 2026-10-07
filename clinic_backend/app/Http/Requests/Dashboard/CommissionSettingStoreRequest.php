<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class CommissionSettingStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('commission-settings.create');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'vendor_id' => ['nullable', 'exists:users,id'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'frequency' => ['required', 'in:daily,weekly,monthly,quarterly'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'vendor_id.exists' => __('common.vendor_not_found'),
            'commission_rate.required' => __('common.commission_rate_required'),
            'commission_rate.numeric' => __('common.commission_rate_must_be_numeric'),
            'commission_rate.min' => __('common.commission_rate_min'),
            'commission_rate.max' => __('common.commission_rate_max'),
            'frequency.required' => __('common.frequency_required'),
            'frequency.in' => __('common.frequency_invalid'),
            'description.max' => __('common.description_max_length'),
        ];
    }
}

