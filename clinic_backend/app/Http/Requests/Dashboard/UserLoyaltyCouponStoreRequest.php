<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class UserLoyaltyCouponStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Permission not found in seeder
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'code' => ['nullable', 'string', 'max:50'],
            'title_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'title_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'description_en' => ['nullable', 'string', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', new ArabicOnly()],
            'discount_type' => ['required', 'in:percentage,fixed'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'minimum_order_amount' => ['nullable', 'numeric', 'min:0'],
            'maximum_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after:valid_from'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => __('common.user_required'),
            'user_id.exists' => __('common.user_not_found'),
            'title_en.required' => __('common.title_en_required'),
            'title_ar.required' => __('common.title_ar_required'),
            'discount_type.required' => __('common.discount_type_required'),
            'discount_value.required' => __('common.discount_value_required'),
            'valid_from.required' => __('common.valid_from_required'),
            'valid_until.required' => __('common.valid_until_required'),
            'valid_until.after' => __('common.valid_until_must_be_after_valid_from'),
            'status.required' => __('common.status_required'),
        ];
    }
}

