<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class ContactUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('contacts.edit');
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pending,resolved'],
            'admin_response' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'status' => __('common.status'),
            'admin_response' => __('common.admin_response'),
        ];
    }
}

