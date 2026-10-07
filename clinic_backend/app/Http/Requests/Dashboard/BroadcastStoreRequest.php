<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class BroadcastStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('broadcasts.create');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'title_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'message_en' => ['required', 'string', new EnglishOnly()],
            'message_ar' => ['required', 'string', new ArabicOnly()],
            'recipient_type' => ['required', 'in:roles,specific_users'],
            'target_roles' => ['required_if:recipient_type,roles', 'array'],
            'target_roles.*' => ['string', 'exists:roles,name'],
            'selected_users' => ['required_if:recipient_type,specific_users', 'array'],
            'selected_users.*' => ['integer', 'exists:users,id'],
            'send_type' => ['nullable', 'in:now,scheduled,draft'],
            'scheduled_at' => ['required_if:send_type,scheduled', 'nullable', 'date', 'after:now'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title_en.required' => __('common.title_en_required'),
            'title_en.max' => __('common.title_max_length'),
            'title_ar.required' => __('common.title_ar_required'),
            'title_ar.max' => __('common.title_max_length'),
            'message_en.required' => __('common.message_en_required'),
            'message_ar.required' => __('common.message_ar_required'),
            'recipient_type.required' => __('common.recipient_type_required'),
            'recipient_type.in' => __('common.recipient_type_invalid'),
            'target_roles.required_if' => __('common.target_roles_required'),
            'target_roles.array' => __('common.target_roles_must_be_array'),
            'target_roles.*.exists' => __('common.target_roles_invalid'),
            'selected_users.required_if' => __('common.selected_users_required'),
            'selected_users.array' => __('common.selected_users_must_be_array'),
            'selected_users.*.exists' => __('common.selected_users_invalid'),
        ];
    }
}