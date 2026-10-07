<?php

namespace App\Http\Requests\Api\V1\Booking;

use App\Enums\BookingReasonType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class BookingReasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', new Enum(BookingReasonType::class)],
        ];
    }
}


