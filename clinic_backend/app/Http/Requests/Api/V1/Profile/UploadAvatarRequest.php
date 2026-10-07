<?php

namespace App\Http\Requests\Api\V1\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => __('common.avatar_required'),
            'avatar.image' => __('common.avatar_must_be_image'),
            'avatar.mimes' => __('common.avatar_mimes'),
            'avatar.max' => __('common.avatar_max_size'),
        ];
    }
}


