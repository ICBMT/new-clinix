<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Models\Clinic;
use App\Rules\KuwaitPhone;
use App\Rules\EnglishOnly;
use App\Rules\ArabicOnly;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Always validate step first
        $baseRules = [
            'step' => ['required', 'integer', 'in:1,2,3,4,5,6,7'],
        ];

        $step = (int) $this->input('step', 1);

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

    protected function getStep1Rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', new KuwaitPhone()],
            'password' => ['required', 'confirmed', Password::defaults()],
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
            'address' => ['nullable', 'string', 'min:3', 'max:500'],
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
            'cancellation_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'cancellation_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'privacy_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'privacy_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'terms_and_conditions_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'terms_and_conditions_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
            'refund_policy_en' => ['nullable', 'string', 'max:10000', new EnglishOnly()],
            'refund_policy_ar' => ['nullable', 'string', 'max:10000', new ArabicOnly()],
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

    public function messages(): array
    {
        $step = $this->input('step', 1);

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
            'governorate_id.exists' => __('common.governorate_not_found'),
            'area_id.exists' => __('common.area_not_found'),
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
            'cancellation_policy_en.max' => __('common.policy_max_length'),
            'cancellation_policy_ar.max' => __('common.policy_max_length'),
            'privacy_policy_en.max' => __('common.policy_max_length'),
            'privacy_policy_ar.max' => __('common.policy_max_length'),
            'terms_and_conditions_en.max' => __('common.policy_max_length'),
            'terms_and_conditions_ar.max' => __('common.policy_max_length'),
            'refund_policy_en.max' => __('common.policy_max_length'),
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

    protected function getStep7Rules(): array
    {
        return [
            'subscription_package_id' => ['nullable', 'integer', 'exists:subscription_packages,id'],
        ];
    }

    protected function getStep7Messages(): array
    {
        return [
            'subscription_package_id.exists' => __('common.subscription_package_not_found'),
            'subscription_package_id.integer' => __('common.subscription_package_invalid'),
        ];
    }
}
