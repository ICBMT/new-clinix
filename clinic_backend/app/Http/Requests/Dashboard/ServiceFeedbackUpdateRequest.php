<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class ServiceFeedbackUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:service,vendor,general'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'status' => ['required', 'in:active,inactive'],
            'is_active' => ['nullable', 'boolean'],
            'admin_response' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'type' => __('common.type'),
            'subject' => __('common.subject'),
            'message' => __('common.message'),
            'rating' => __('common.rating'),
            'status' => __('common.status'),
            'is_active' => __('common.is_active'),
            'admin_response' => __('common.admin_response'),
        ];
    }
}

