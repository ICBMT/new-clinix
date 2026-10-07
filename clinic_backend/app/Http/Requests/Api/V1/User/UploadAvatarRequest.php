<?php

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,gif', 'max:10048'], // 100MB max
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => __('common.avatar_required'),
            'avatar.image' => __('common.avatar_must_be_image'),
            'avatar.mimes' => __('common.avatar_invalid_format'),
            'avatar.max' => __('common.avatar_size_exceeded'),
        ];
    }
}
