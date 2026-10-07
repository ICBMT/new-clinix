<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class UserLoyaltyCouponStreakUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'total_bookings' => ['nullable', 'integer', 'min:0'],
            'total_loyalty_coupons_earned' => ['nullable', 'integer', 'min:0'],
            'current_booking_streak' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'total_bookings' => __('common.total_bookings'),
            'status' => __('common.status'),
        ];
    }
}

