<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscriptionPackageUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('subscription-packages.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $id = $this->route('subscription-package') ?? $this->route('id');
        $idValue = is_object($id) ? $id->id : $id;

        return [
            'name_en' => ['required', 'string', 'max:255', Rule::unique('subscription_packages', 'name_en')->ignore($idValue), new EnglishOnly()],
            'name_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'description_en' => ['nullable', 'string', 'max:2000', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', 'max:2000', new ArabicOnly()],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'billing_cycle' => ['required', 'in:monthly,quarterly,yearly'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'features' => ['nullable', 'array'],
            'max_services' => ['nullable', 'integer', 'min:0'],
            'max_bookings_per_month' => ['nullable', 'integer', 'min:0'],
            'featured_listing' => ['nullable', 'boolean'],
            'priority_support' => ['nullable', 'boolean'],
            'analytics_access' => ['nullable', 'boolean'],
            'custom_branding' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name_en.required' => __('common.name_en_required'),
            'name_en.max' => __('common.name_en_max_length', ['max' => 255]),
            'name_en.unique' => __('common.name_en_already_exists'),
            'name_en.english_only' => __('common.clinic_name_en_must_be_english'),
            'name_ar.required' => __('common.name_ar_required'),
            'name_ar.max' => __('common.name_ar_max_length', ['max' => 255]),
            'name_ar.arabic_only' => __('common.clinic_name_ar_must_be_arabic'),
            'description_en.max' => __('common.description_en_max_length', ['max' => 2000]),
            'description_en.english_only' => __('common.field_must_be_english_only'),
            'description_ar.max' => __('common.description_ar_max_length', ['max' => 2000]),
            'description_ar.arabic_only' => __('common.field_must_be_arabic_only'),
            'price.required' => __('common.price_required'),
            'price.numeric' => __('common.price_must_be_numeric'),
            'price.min' => __('common.price_min_zero'),
            'currency.required' => __('common.currency_required'),
            'currency.max' => __('common.currency_max_length', ['max' => 3]),
            'billing_cycle.required' => __('common.billing_cycle_required'),
            'billing_cycle.in' => __('common.billing_cycle_invalid'),
            'duration_days.required' => __('common.duration_days_required'),
            'duration_days.integer' => __('common.duration_days_must_be_integer'),
            'duration_days.min' => __('common.duration_days_min', ['min' => 1]),
            'duration_days.max' => __('common.duration_days_max', ['max' => 3650]),
            'max_services.integer' => __('common.max_services_must_be_integer'),
            'max_services.min' => __('common.max_services_min', ['min' => 0]),
            'max_bookings_per_month.integer' => __('common.max_bookings_per_month_must_be_integer'),
            'max_bookings_per_month.min' => __('common.max_bookings_per_month_min', ['min' => 0]),
            'status.in' => __('common.status_invalid'),
            'sort_order.integer' => __('common.sort_order_must_be_integer'),
            'sort_order.min' => __('common.sort_order_min', ['min' => 0]),
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name_en' => __('common.name_en'),
            'name_ar' => __('common.name_ar'),
            'description_en' => __('common.description_en'),
            'description_ar' => __('common.description_ar'),
            'price' => __('common.price'),
            'currency' => __('common.currency'),
            'billing_cycle' => __('common.billing_cycle'),
            'duration_days' => __('common.duration_days'),
            'max_services' => __('common.max_services'),
            'max_bookings_per_month' => __('common.max_bookings_per_month'),
            'status' => __('common.status'),
            'sort_order' => __('common.sort_order'),
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Convert empty strings to null for nullable fields
        $nullableFields = ['description_en', 'description_ar', 'max_services', 'max_bookings_per_month'];
        foreach ($nullableFields as $field) {
            if ($this->has($field) && $this->$field === '') {
                $this->merge([$field => null]);
            }
        }
    }
}

