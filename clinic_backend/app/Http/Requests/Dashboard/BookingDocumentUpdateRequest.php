<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class BookingDocumentUpdateRequest extends FormRequest
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
            'booking_id' => ['sometimes', 'required', 'integer', 'exists:bookings,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'file' => ['sometimes', 'file', 'max:10240', 'mimes:pdf,doc,docx,jpg,jpeg,png'], // 10MB max
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'booking_id.required' => __('validation.required', ['attribute' => __('common.booking')]),
            'booking_id.exists' => __('validation.exists', ['attribute' => __('common.booking')]),
            'name.required' => __('validation.required', ['attribute' => __('common.name')]),
            'file.max' => __('validation.max.file', ['attribute' => __('common.file'), 'max' => '10MB']),
            'file.mimes' => __('validation.mimes', ['attribute' => __('common.file'), 'values' => 'PDF, DOC, DOCX, JPG, JPEG, PNG']),
        ];
    }
}

