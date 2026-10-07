<?php

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file_name' => ['sometimes', 'string', 'max:255'],
            'collection_name' => ['sometimes', 'string', 'max:255'],
            'disk' => ['sometimes', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => __('common.name_max_length'),
        ];
    }
}

