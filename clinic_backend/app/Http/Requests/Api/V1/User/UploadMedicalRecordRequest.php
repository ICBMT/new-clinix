<?php

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'record_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => __('common.file_required'),
            'file.file' => __('common.file_must_be_file'),
            'file.mimes' => __('common.file_invalid_format'),
            'file.max' => __('common.file_max_size'),
            'name.required' => __('common.name_required'),
            'name.max' => __('common.name_max_length'),
        ];
    }
}


