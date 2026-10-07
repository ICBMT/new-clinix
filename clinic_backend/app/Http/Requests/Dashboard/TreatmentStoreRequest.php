<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class TreatmentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('treatments.create');
    }

    public function rules(): array
    {
        $rules = [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'name_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'description_en' => ['nullable', 'string', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', new ArabicOnly()],
            'service_duration_minutes' => ['required', 'integer', 'min:1'],
            'sessions_required' => ['required', 'integer', 'min:1'],
            'base_price' => ['required', 'numeric', 'min:0', 'max:2000000'],
            'discount_type' => ['nullable', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0', function ($attribute, $value, $fail) {
                if ($value !== null && $value !== '') {
                    $basePrice = $this->input('base_price');
                    $discountType = $this->input('discount_type');
                    $hasDiscount = $this->input('has_discount', false);
                    
                    if ($hasDiscount && $basePrice) {
                        if ($discountType === 'fixed') {
                            // For fixed discount, discount_value must be less than base_price
                            if ($value >= $basePrice) {
                                $fail(__('common.discount_value_must_be_less_than_base_price'));
                            }
                        } elseif ($discountType === 'percentage') {
                            // For percentage discount, discount_value must be less than 100
                            if ($value > 100) {
                                $fail(__('common.discount_percentage_cannot_exceed_100'));
                            }
                            // Also check that final price won't be negative
                            $calculatedFinalPrice = $basePrice * (1 - $value / 100);
                            if ($calculatedFinalPrice < 0) {
                                $fail(__('common.final_price_cannot_be_negative'));
                            }
                        }
                    }
                }
            }],
            'final_price' => ['nullable', 'numeric', 'min:0', function ($attribute, $value, $fail) {
                $basePrice = $this->input('base_price');
                if ($value && $basePrice && $value > $basePrice) {
                    $fail(__('common.discounted_price_cannot_exceed_base_price'));
                }
            }],
            'has_discount' => ['nullable', 'boolean'],
            'status' => ['required', 'in:pending,approved,rejected'],
            'is_featured' => ['nullable', 'boolean'],
            'max_sessions' => ['nullable', 'integer', 'min:1'],
            'machine_ids' => ['nullable', 'array'],
            'machine_ids.*' => ['integer', 'exists:machines,id'],
        ];

        $user = $this->user();
        $isClinicRole = $user && $user->hasRole('clinic') && !$user->hasRole('super-admin');
        
        // For clinic role: clinic_id is required (can't create global treatments)
        // For super admin: clinic_id is required (but can be set to null for global treatments)
        if ($isClinicRole) {
            $rules['clinic_id'] = ['required', 'integer', 'exists:clinics,id'];
        } else {
            $rules['clinic_id'] = ['required', 'integer', 'exists:clinics,id'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'clinic_id.required' => __('common.clinic_required'),
            'clinic_id.exists' => __('common.clinic_not_found'),
            'category_id.required' => __('common.category_required'),
            'category_id.exists' => __('common.category_not_found'),
            'name_en.required' => __('common.name_en_required'),
            'name_ar.required' => __('common.name_ar_required'),
            'base_price.required' => __('common.price_required'),
            'base_price.numeric' => __('common.price_invalid'),
            'base_price.min' => __('common.price_min_zero'),
            'base_price.max' => __('common.price_max_exceeded'),
            'status.required' => __('common.status_required'),
            'status.in' => __('common.status_invalid'),
        ];
    }
}


