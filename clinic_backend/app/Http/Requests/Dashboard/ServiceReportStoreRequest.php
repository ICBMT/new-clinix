<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class ServiceReportStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'vendor_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'status' => ['required', 'in:open,in_review,resolved,dismissed'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'user_id' => __('common.user'),
            'vendor_id' => __('common.vendor'),
            'service_id' => __('common.service'),
            'reason' => __('common.reason'),
            'description' => __('common.description'),
            'status' => __('common.status'),
            'is_active' => __('common.is_active'),
        ];
    }
}

