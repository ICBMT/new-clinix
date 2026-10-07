<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class TreatmentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('treatments.edit');
    }

    protected function prepareForValidation(): void
    {
        // Convert empty strings to null for nullable fields
        $this->merge([
            'description_en' => $this->input('description_en') === '' ? null : $this->input('description_en'),
            'description_ar' => $this->input('description_ar') === '' ? null : $this->input('description_ar'),
            'discount_value' => $this->input('discount_value') === '' ? null : $this->input('discount_value'),
            'discount_type' => $this->input('has_discount') ? ($this->input('discount_type') === '' ? null : $this->input('discount_type')) : null,
        ]);
        
        $user = $this->user();
        $isClinicRole = $user && $user->hasRole('clinic') && !$user->hasRole('super-admin');
        
        // For clinic role, don't allow setting clinic_id to null
        if ($isClinicRole) {
            if ($this->has('clinic_id') && ($this->clinic_id === '' || $this->clinic_id === null)) {
                // Keep existing clinic_id if trying to set to empty
                $treatmentId = $this->route('id');
                if ($treatmentId) {
                    $treatment = \App\Models\Treatment::find($treatmentId);
                    if ($treatment && $treatment->clinic_id) {
                        $this->merge(['clinic_id' => $treatment->clinic_id]);
                    }
                }
            }
        }
    }

    public function rules(): array
    {
        $rules = [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'name_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'description_en' => ['nullable', 'string', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', new ArabicOnly()],
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
            'service_duration_minutes' => ['required', 'integer', 'min:1'],
            'sessions_required' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:pending,approved,rejected'],
            'is_featured' => ['nullable', 'boolean'],
            'max_sessions' => ['nullable', 'integer', 'min:1'],
            'rejection_reason' => ['nullable', 'string', 'max:500'],
            'machine_ids' => ['nullable', 'array'],
            'machine_ids.*' => ['integer', 'exists:machines,id'],
        ];

        $user = $this->user();
        $isClinicRole = $user && $user->hasRole('clinic') && !$user->hasRole('super-admin');
        
        // For clinic role: clinic_id is required (can't make treatment global)
        // For super admin: clinic_id can be required (but can be set to null for global treatments)
        if ($isClinicRole) {
            $rules['clinic_id'] = ['required', 'integer', 'exists:clinics,id'];
        } else {
            $rules['clinic_id'] = ['required', 'integer', 'exists:clinics,id'];
        }

        return $rules;
    }

    public function attributes(): array
    {
        return [
            'base_price' => __('common.price') ?: 'Price',
            'description_en' => __('common.description_en') ?: 'Description (English)',
            'description_ar' => __('common.description_ar') ?: 'Description (Arabic)',
        ];
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


