<?php

namespace App\Http\Requests\Api\V1\Notification;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email_notifications' => ['sometimes', 'boolean'],
            'push_notifications' => ['sometimes', 'boolean'],
            'sms_notifications' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'email_notifications.boolean' => __('common.email_notifications_boolean'),
            'push_notifications.boolean' => __('common.push_notifications_boolean'),
            'sms_notifications.boolean' => __('common.sms_notifications_boolean'),
        ];
    }
}


