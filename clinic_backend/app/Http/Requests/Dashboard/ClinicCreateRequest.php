<?php

namespace App\Http\Requests\Dashboard;

use App\Models\User;
use App\Models\Clinic;
use App\Rules\KuwaitPhone;
use App\Rules\EnglishOnly;
use App\Rules\ArabicOnly;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Contracts\Validation\Validator;

class ClinicCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('clinics.create');
    }

    public function rules(): array
    {
        // Check if this is a step validation or final submission
        $step = $this->input('step');
        
        // If step is provided, validate only that step
        if ($step !== null) {
            $baseRules = [
                'step' => ['required', 'integer', 'in:1,2,3,4,5,6,7'],
            ];

            $step = (int) $step;
            $stepRules = match ($step) {
                1 => $this->getStep1Rules(),
                2 => $this->getStep2Rules(),
                3 => $this->getStep3Rules(),
                4 => $this->getStep4Rules(),
                5 => $this->getStep5Rules(),
                6 => $this->getStep6Rules(),
                7 => $this->getStep7Rules(),
                default => [],
            };

            return array_merge($baseRules, $stepRules);
        }
        
        // Final submission: validate all steps
        return array_merge(
            $this->getStep1Rules(),
            $this->getStep2Rules(),
            $this->getStep3Rules(),
            $this->getStep4Rules(),
            $this->getStep5Rules(),
            $this->getStep6Rules(),
            $this->getStep7Rules(),
            [
                'create_new_user' => ['sometimes', 'boolean'],
            ]
        );
    }

    protected function getStep1Rules(): array
    {
        // Step 1: User account information (only if creating new user)
        // Check create_new_user flag first (most reliable indicator)
        $createNewUserInput = $this->input('create_new_user');
        $createNewUser = $this->boolean('create_new_user', false) 
            || $createNewUserInput === '1' 
            || $createNewUserInput === 1 
            || $createNewUserInput === true;
        
        // Check if user_id is provided and not empty
        $userId = $this->input('user_id');
        $hasUserId = !empty($userId) && $userId !== '' && $userId !== null && $userId !== '0';
        
        // If create_new_user is explicitly false/0 and user_id is provided, we're selecting existing user
        if (!$createNewUser && $hasUserId) {
            // Selecting existing user - only user_id is required, personal info is NOT required
            return [
                'user_id' => ['required', 'integer', 'exists:users,id'],
                'name' => ['nullable', 'string', 'max:255'],
                'email' => ['nullable', 'email', 'max:255'],
                'phone' => ['nullable', 'string', new KuwaitPhone()],
                'password' => ['nullable', 'string'],
                'password_confirmation' => ['nullable', 'string'],
            ];
        }
        
        // Otherwise, we're creating new user - require personal info
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', new KuwaitPhone(), 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'user_id' => ['nullable'], // Explicitly make user_id nullable when creating new user
        ];
    }

    protected function getStep2Rules(): array
    {
        return [
            'name_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'name_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', new KuwaitPhone()],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'bio_en' => ['nullable', 'string', 'max:5000', new EnglishOnly()],
            'bio_ar' => ['nullable', 'string', 'max:5000', new ArabicOnly()],
        ];
    }

    protected function getStep3Rules(): array
    {
        return [
            'governorate_id' => ['required', 'integer', 'exists:governorates,id'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'address' => ['required', 'string', 'min:3', 'max:500'],
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
        ];
    }

    protected function getStep4Rules(): array
    {
        return [
            'auto_confirm_bookings' => ['nullable', 'boolean'],
            'new_booking_alerts' => ['nullable', 'boolean'],
            'cancellation_alerts' => ['nullable', 'boolean'],
            'review_alerts' => ['nullable', 'boolean'],
            'email_notifications_enabled' => ['nullable', 'boolean'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'cancellation_policy_en' => ['required', 'string', 'max:10000', new EnglishOnly()],
            'cancellation_policy_ar' => ['required', 'string', 'max:10000', new ArabicOnly()],
            'refund_policy_en' => ['required', 'string', 'max:10000', new EnglishOnly()],
            'refund_policy_ar' => ['required', 'string', 'max:10000', new ArabicOnly()],
            'reschedule_policy_en' => ['required', 'string', 'max:10000', new EnglishOnly()],
            'reschedule_policy_ar' => ['required', 'string', 'max:10000', new ArabicOnly()],
        ];
    }

    protected function getStep5Rules(): array
    {
        return [
            'operating_hours' => ['required', 'array', 'size:7'],
            'operating_hours.*.day_of_week' => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'operating_hours.*.is_open' => ['nullable', 'boolean'],
            'operating_hours.*.closed_all_day' => ['nullable', 'boolean'],
            'operating_hours.*.opening_time' => ['nullable', 'date_format:H:i'],
            'operating_hours.*.closing_time' => ['nullable', 'date_format:H:i'],
        ];
    }

    protected function getStep6Rules(): array
    {
        return [
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:10240'],
            'business_license' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'id_document_front' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'id_document_back' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    protected function getStep7Rules(): array
    {
        return [
            'subscription_package_id' => ['nullable', 'integer', 'exists:subscription_packages,id'],
        ];
    }

    public function messages(): array
    {
        $step = $this->input('step');
        
        // If step is provided, return messages for that step only
        if ($step !== null) {
            return match ((int) $step) {
                1 => $this->getStep1Messages(),
                2 => $this->getStep2Messages(),
                3 => $this->getStep3Messages(),
                4 => $this->getStep4Messages(),
                5 => $this->getStep5Messages(),
                6 => $this->getStep6Messages(),
                7 => $this->getStep7Messages(),
                default => [],
            };
        }
        
        // Final submission: return all messages
        return array_merge(
            $this->getStep1Messages(),
            $this->getStep2Messages(),
            $this->getStep3Messages(),
            $this->getStep4Messages(),
            $this->getStep5Messages(),
            $this->getStep6Messages(),
            $this->getStep7Messages()
        );
    }

    protected function getStep1Messages(): array
    {
        return [
            'name.required' => __('common.name_required'),
            'name.max' => __('common.name_too_long'),
            'email.required' => __('common.auth_email_required'),
            'email.email' => __('common.auth_email_invalid'),
            'email.max' => __('common.email_too_long'),
            'phone.required' => __('common.auth_phone_required'),
            'password.required' => __('common.auth_password_required'),
            'password.confirmed' => __('common.passwords_do_not_match'),
            'user_id.required' => __('common.user_required'),
            'user_id.exists' => __('common.user_not_found'),
        ];
    }

    protected function getStep2Messages(): array
    {
        return [
            'name_en.required' => __('common.clinic_name_en_required'),
            'name_en.max' => __('common.clinic_name_en_max'),
            'name_ar.required' => __('common.clinic_name_ar_required'),
            'name_ar.max' => __('common.clinic_name_ar_max'),
            'phone.required' => __('common.clinic_phone_required'),
            'category_id.exists' => __('common.category_not_found'),
            'bio_en.max' => __('common.bio_max_length'),
            'bio_ar.max' => __('common.bio_max_length'),
        ];
    }

    protected function getStep3Messages(): array
    {
        return [
            'governorate_id.required' => __('common.governorate_required'),
            'governorate_id.exists' => __('common.governorate_not_found'),
            'area_id.required' => __('common.area_required'),
            'area_id.exists' => __('common.area_not_found'),
            'address.required' => __('common.address_required'),
            'address.min' => __('common.address_must_be_at_least_3_characters'),
            'address.max' => __('common.address_must_not_exceed_500_characters'),
            'latitude.between' => __('common.latitude_invalid'),
            'longitude.between' => __('common.longitude_invalid'),
        ];
    }

    protected function getStep4Messages(): array
    {
        return [
            'notification_email.email' => __('common.auth_email_invalid'),
            'notification_email.max' => __('common.email_too_long'),
            'cancellation_policy_en.required' => __('common.cancellation_policy_en_required'),
            'cancellation_policy_en.max' => __('common.policy_max_length'),
            'cancellation_policy_ar.required' => __('common.cancellation_policy_ar_required'),
            'cancellation_policy_ar.max' => __('common.policy_max_length'),
            'refund_policy_en.required' => __('common.refund_policy_en_required'),
            'refund_policy_en.max' => __('common.policy_max_length'),
            'refund_policy_ar.required' => __('common.refund_policy_ar_required'),
            'refund_policy_ar.max' => __('common.policy_max_length'),
            'reschedule_policy_en.required' => __('common.reschedule_policy_en_required'),
            'reschedule_policy_en.max' => __('common.policy_max_length'),
            'reschedule_policy_ar.required' => __('common.reschedule_policy_ar_required'),
            'reschedule_policy_ar.max' => __('common.policy_max_length'),
        ];
    }

    protected function getStep5Messages(): array
    {
        return [
            'operating_hours.required' => __('common.operating_hours_required'),
            'operating_hours.array' => __('common.operating_hours_must_be_array'),
            'operating_hours.size' => __('common.operating_hours_must_have_7_days'),
            'operating_hours.*.day_of_week.required' => __('common.day_of_week_required'),
            'operating_hours.*.day_of_week.in' => __('common.day_of_week_invalid'),
            'operating_hours.*.opening_time.date_format' => __('common.opening_time_invalid_format'),
            'operating_hours.*.closing_time.date_format' => __('common.closing_time_invalid_format'),
        ];
    }

    protected function getStep6Messages(): array
    {
        return [
            'business_license.required' => __('common.business_license_required'),
            'business_license.file' => __('common.file_must_be_file'),
            'business_license.mimes' => __('common.file_invalid_format'),
            'business_license.max' => __('common.file_size_exceeds_max'),
            'id_document_front.required' => __('common.id_document_front_required'),
            'id_document_front.file' => __('common.file_must_be_file'),
            'id_document_front.mimes' => __('common.file_invalid_format'),
            'id_document_front.max' => __('common.file_size_exceeds_max'),
            'id_document_back.file' => __('common.file_must_be_file'),
            'id_document_back.mimes' => __('common.file_invalid_format'),
            'id_document_back.max' => __('common.file_size_exceeds_max'),
            'logo.image' => __('common.logo_must_be_image'),
            'logo.mimes' => __('common.logo_invalid_format'),
            'logo.max' => __('common.logo_size_exceeded'),
        ];
    }

    protected function getStep7Messages(): array
    {
        return [
            'subscription_package_id.exists' => __('common.subscription_package_not_found'),
            'subscription_package_id.integer' => __('common.subscription_package_invalid'),
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => __('common.name'),
            'email' => __('common.email'),
            'phone' => __('common.phone_number'),
            'password' => __('common.password'),
            'user_id' => __('common.user'),
            'name_en' => __('common.company_name_english'),
            'name_ar' => __('common.company_name_arabic'),
            'category_id' => __('common.category'),
            'bio_en' => __('common.bio_english'),
            'bio_ar' => __('common.bio_arabic'),
            'governorate_id' => __('common.governorate'),
            'area_id' => __('common.area'),
            'address' => __('common.address'),
            'notification_email' => __('common.notification_email'),
            'cancellation_policy_en' => __('common.cancellation_policy_en'),
            'cancellation_policy_ar' => __('common.cancellation_policy_ar'),
            'refund_policy_en' => __('common.refund_policy_en'),
            'refund_policy_ar' => __('common.refund_policy_ar'),
            'reschedule_policy_en' => __('common.reschedule_policy_en'),
            'reschedule_policy_ar' => __('common.reschedule_policy_ar'),
            'operating_hours' => __('common.operating_hours'),
            'operating_hours.*.day_of_week' => __('common.day_of_week'),
            'operating_hours.*.opening_time' => __('common.opening_time'),
            'operating_hours.*.closing_time' => __('common.closing_time'),
            'business_license' => __('common.business_license'),
            'id_document_front' => __('common.id_document_front'),
            'id_document_back' => __('common.id_document_back'),
            'logo' => __('common.logo'),
            'subscription_package_id' => __('common.subscription_package'),
        ];
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
        });
    }
}

