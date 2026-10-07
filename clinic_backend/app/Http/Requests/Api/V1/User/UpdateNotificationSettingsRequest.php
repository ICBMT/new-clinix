<?php

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'appointment_reminders' => ['sometimes', 'boolean'],
            'reschedule_alerts' => ['sometimes', 'boolean'],
            'promotions_offers' => ['sometimes', 'boolean'],
            'payment_confirmations' => ['sometimes', 'boolean'],
            'review_requests' => ['sometimes', 'boolean'],
            'special_offers' => ['sometimes', 'boolean'],
        ];
    }
}


