<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use App\Rules\KuwaitPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Contracts\Validation\Validator;

class ClinicUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('clinics.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Get clinic ID from route - try 'clinic' first (route model binding), then 'id' as fallback
        $clinicId = $this->route('clinic');
        if (!$clinicId) {
            $clinicId = $this->route('id');
        }
        // Handle both object (route model binding) and integer (direct ID) cases
        $clinicIdValue = is_object($clinicId) ? $clinicId->id : ($clinicId ? (int) $clinicId : null);
        
        // Get owner_id from request or from clinic route
        $ownerId = $this->input('owner_id');
        if (!$ownerId && $clinicIdValue) {
            $clinic = \App\Models\Clinic::find($clinicIdValue);
            $ownerId = $clinic?->owner_id;
        }
        
        return [
            'owner_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'user_name' => ['sometimes', 'required', 'string', 'max:255'],
            'user_email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($ownerId)],
            'user_phone' => ['sometimes', 'required', 'string', new KuwaitPhone(), Rule::unique('users', 'phone')->ignore($ownerId)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'password_confirmation' => ['nullable'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255', new EnglishOnly(), Rule::unique('clinics', 'name_en')->ignore($clinicIdValue)],
            'name_ar' => ['sometimes', 'required', 'string', 'max:255', new ArabicOnly(), Rule::unique('clinics', 'name_ar')->ignore($clinicIdValue)],
            'company_name_en' => ['sometimes', 'required', 'string', 'max:255', new EnglishOnly()], // Keep for backward compatibility
            'company_name_ar' => ['sometimes', 'required', 'string', 'max:255', new ArabicOnly()], // Keep for backward compatibility
            'bio_en' => ['nullable', 'string', 'max:1000', new EnglishOnly()],
            'bio_ar' => ['nullable', 'string', 'max:1000', new ArabicOnly()],
            'phone' => ['sometimes', 'required', 'string', new KuwaitPhone()],
            'whatsapp' => ['nullable', 'string', new KuwaitPhone()],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'address' => ['sometimes', 'required', 'string', 'max:500'],
            'governorate_id' => ['nullable', 'integer', 'exists:governorates,id'],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'block' => ['nullable', 'string', 'max:50'],
            'street' => ['nullable', 'string', 'max:100'],
            'avenue' => ['nullable', 'string', 'max:100'],
            'house' => ['nullable', 'string', 'max:50'],
            'floor' => ['nullable', 'string', 'max:50'],
            'apt' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'business_license' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'id_document_front' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'id_document_back' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
            'status' => ['sometimes', 'string', 'in:pending,approved,rejected,suspended'],
            'social_links' => ['nullable', 'array'],
            'years_in_business' => ['nullable', 'integer', 'min:0'],
            'verification_status' => ['sometimes', 'string', 'in:pending,approved,rejected'],
            'rejection_reason' => ['nullable', 'string', 'max:500'],
            'is_featured' => ['sometimes', 'boolean'],
            'auto_confirm_bookings' => ['nullable', 'boolean'],
            'cancellation_policy_en' => ['required', 'string', 'max:10000', new EnglishOnly()],
            'cancellation_policy_ar' => ['required', 'string', 'max:10000', new ArabicOnly()],
            'privacy_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'privacy_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'terms_and_conditions_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'terms_and_conditions_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'refund_policy_en' => ['required', 'string', 'max:10000', new EnglishOnly()],
            'refund_policy_ar' => ['required', 'string', 'max:10000', new ArabicOnly()],
            'reschedule_policy_en' => ['required', 'string', 'max:10000', new EnglishOnly()],
            'reschedule_policy_ar' => ['required', 'string', 'max:10000', new ArabicOnly()],
            'rescheduling_buffer_hours' => ['nullable', 'integer', 'min:0'],
            'cancellation_buffer_hours' => ['nullable', 'integer', 'min:0'],
            'refund_policy_type' => ['nullable', 'string', 'in:full,partial,fixed'],
            'refund_policy_percentage' => ['nullable', 'numeric', 'min:0'],
            // Office hours
            'working_days' => ['nullable', 'array'],
            'working_days.*' => ['integer', 'min:1', 'max:7'],
            'opening_time' => ['nullable', 'date_format:H:i'],
            'closing_time' => ['nullable', 'date_format:H:i'],
            'lunch_break_start' => ['nullable', 'date_format:H:i'],
            'lunch_break_end' => ['nullable', 'date_format:H:i'],
            'is_24_hours' => ['sometimes', 'boolean'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'min_advance_booking_hours' => ['nullable', 'integer', 'min:0'],
            'max_advance_booking_days' => ['nullable', 'integer', 'min:1'],
            'buffer_time_minutes' => ['nullable', 'integer', 'min:0'],
            'operating_hours' => ['nullable', 'array'],
            'operating_hours.*.day_of_week' => ['required', 'string'],
            'operating_hours.*.opening_time' => ['nullable', 'string'],
            'operating_hours.*.closing_time' => ['nullable', 'string'],
            'operating_hours.*.is_open' => ['required', 'boolean'],
            'operating_hours.*.closed_all_day' => ['nullable', 'boolean'],
            'subscription_package_id' => ['nullable', 'integer', 'exists:subscription_packages,id'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Map company_name to name for backward compatibility
        if ($this->has('company_name_en') && !$this->has('name_en')) {
            $this->merge(['name_en' => $this->input('company_name_en')]);
        }
        if ($this->has('company_name_ar') && !$this->has('name_ar')) {
            $this->merge(['name_ar' => $this->input('company_name_ar')]);
        }
        
        // Convert empty strings to null for nullable integer fields
        if ($this->has('governorate_id')) {
            $value = $this->input('governorate_id');
            if ($value === '' || $value === null) {
                $this->merge(['governorate_id' => null]);
            } else {
                $this->merge(['governorate_id' => (int) $value]);
            }
        }
        
        if ($this->has('area_id')) {
            $value = $this->input('area_id');
            if ($value === '' || $value === null) {
                $this->merge(['area_id' => null]);
            } else {
                $this->merge(['area_id' => (int) $value]);
            }
        }
        
        // Convert '1'/'0' strings to boolean for auto_confirm_bookings
        if ($this->has('auto_confirm_bookings')) {
            $value = $this->input('auto_confirm_bookings');
            if ($value === '1' || $value === 1 || $value === 'true' || $value === true) {
                $this->merge(['auto_confirm_bookings' => true]);
            } elseif ($value === '0' || $value === 0 || $value === 'false' || $value === false) {
                $this->merge(['auto_confirm_bookings' => false]);
            }
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Validate that closing_time is after opening_time for each operating hour
            if ($this->has('operating_hours') && is_array($this->operating_hours)) {
                foreach ($this->operating_hours as $index => $hours) {
                    if (!empty($hours['opening_time']) && !empty($hours['closing_time']) && 
                        isset($hours['is_open']) && $hours['is_open'] && 
                        (!isset($hours['closed_all_day']) || !$hours['closed_all_day'])) {
                        try {
                            $opening = \Carbon\Carbon::createFromFormat('H:i', $hours['opening_time']);
                            $closing = \Carbon\Carbon::createFromFormat('H:i', $hours['closing_time']);
                            
                            if ($closing->lte($opening)) {
                                $validator->errors()->add(
                                    "operating_hours.{$index}.closing_time",
                                    __('common.start_time_must_not_be_greater_than_end_time')
                                );
                            }
                        } catch (\Exception $e) {
                            // Invalid time format - already handled by validation rules
                        }
                    }
                }
            }
            
            // Validate refund_policy_percentage based on refund_policy_type
            $refundPolicyType = $this->input('refund_policy_type');
            $refundPolicyPercentage = $this->input('refund_policy_percentage');
            
            if ($refundPolicyPercentage !== null && $refundPolicyPercentage !== '') {
                $percentageValue = (float) $refundPolicyPercentage;
                
                // If type is partial, limit to 100 (percentage)
                if ($refundPolicyType === 'partial' && $percentageValue > 100) {
                    $validator->errors()->add(
                        'refund_policy_percentage',
                        __('common.refund_policy_percentage_must_not_exceed_100')
                    );
                }
                
                // If type is fixed, no upper limit (can be any positive number)
                // If type is full, percentage should not be set (but we allow it to be null)
            }
        });
    }

    /**
     * Get the validation error messages.
     */
    public function messages(): array
    {
        return [
            'name_en.unique' => __('common.company_name_english_already_taken'),
            'name_ar.unique' => __('common.company_name_arabic_already_taken'),
            'company_name_en.unique' => __('common.company_name_english_already_taken'),
            'company_name_ar.unique' => __('common.company_name_arabic_already_taken'),
            'user_email.unique' => __('common.email_already_taken'),
            'user_phone.unique' => __('common.phone_already_taken'),
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'owner_id' => __('common.owner'),
            'user_name' => __('common.name'),
            'user_email' => __('common.email'),
            'user_phone' => __('common.phone_number'),
            'password' => __('common.password'),
            'password_confirmation' => __('common.password_confirmation'),
            'name_en' => __('common.company_name_english'),
            'name_ar' => __('common.company_name_arabic'),
            'company_name_en' => __('common.company_name_english'),
            'company_name_ar' => __('common.company_name_arabic'),
            'bio_en' => __('common.bio_english'),
            'bio_ar' => __('common.bio_arabic'),
            'phone' => __('common.phone_number'),
            'whatsapp' => __('common.whatsapp'),
            'email' => __('common.email'),
            'website' => __('common.website'),
            'address' => __('common.address'),
            'area_id' => __('common.area'),
            'business_license' => __('common.business_license'),
            'id_document_front' => __('common.id_document_front'),
            'id_document_back' => __('common.id_document_back'),
            'logo' => __('common.logo'),
            'verification_status' => __('common.verification_status'),
            'rejection_reason' => __('common.rejection_reason'),
            'working_days' => __('common.working_days'),
            'opening_time' => __('common.opening_time'),
            'closing_time' => __('common.closing_time'),
        ];
    }
}
