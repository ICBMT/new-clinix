<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class BookingStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'vendor_id' => ['required', 'integer', 'exists:users,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'service_slot_id' => ['nullable', 'integer', 'exists:service_slots,id'],
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'booking_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'add_ons_total' => ['nullable', 'numeric', 'min:0'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'payment_type' => ['nullable', 'string', 'in:full,partial'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'balance_amount' => ['nullable', 'numeric', 'min:0'],
            'balance_due_date' => ['nullable', 'date'],
            'status' => ['required', 'in:pending,confirmed,accepted,rejected,cancelled,completed,no_show'],
            'payment_status' => ['nullable', 'string', 'in:pending,partial,paid,refunded'],
            'special_instructions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'user_id' => __('common.user'),
            'vendor_id' => __('common.vendor'),
            'service_id' => __('common.service'),
            'booking_date' => __('common.booking_date'),
            'status' => __('common.status'),
        ];
    }
}

