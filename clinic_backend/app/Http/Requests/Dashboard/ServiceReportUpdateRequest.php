<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class ServiceReportUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'status' => ['required', 'in:open,in_review,resolved,dismissed'],
            'is_active' => ['nullable', 'boolean'],
            'resolution_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'reason' => __('common.reason'),
            'description' => __('common.description'),
            'status' => __('common.status'),
            'is_active' => __('common.is_active'),
            'resolution_notes' => __('common.resolution_notes'),
        ];
    }
}

