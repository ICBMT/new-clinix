<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SiteSettingUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Get the category from the route
        $category = $this->route('category');
        
        // Check if user can update settings for this category
        return $this->user()->can("site-settings.{$category}.edit");
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.*.id' => ['required', 'integer', 'exists:site_settings,id'],
            'settings.*.value' => ['nullable'],
            'settings.*.type' => ['required', 'string', Rule::in([
                'text', 'password', 'email', 'url', 'number', 'integer', 'float', 'decimal',
                'boolean', 'select', 'json', 'array', 'textarea', 'image'
            ])],
            'settings.*.file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,svg,ico,webp', 'max:2048'], // For logo and favicon uploads
            'category' => ['nullable', 'string', Rule::in([
                'general', 'vendor', 'contact', 'terms', 'privacy', 'loyalty', 'communication', 'myfatoorah', 'support', 'firebase'
            ])],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            foreach ($this->input('settings', []) as $index => $setting) {
                $this->validateSettingValue($validator, $setting, $index);
            }
        });
    }

    /**
     * Validate individual setting values based on their type
     */
    private function validateSettingValue($validator, $setting, $index)
    {
        $value = $setting['value'] ?? null;
        $type = $setting['type'] ?? 'text';

        // Get the setting key to check for specific validations
        $settingId = $setting['id'] ?? null;
        $settingKey = null;
        if ($settingId) {
            $settingModel = \App\Models\SiteSetting::find($settingId);
            $settingKey = $settingModel ? $settingModel->key : null;
        }

        switch ($type) {
            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.invalid_email_address')
                    );
                    // Also add error to the setting key for easier frontend access
                    if ($settingKey) {
                        $validator->errors()->add(
                            $settingKey,
                            __('common.invalid_email_address')
                        );
                    }
                }
                break;

            case 'url':
                if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.value_must_be_valid_url')
                    );
                }
                break;

            case 'number':
            case 'integer':
                if (!is_numeric($value)) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.value_must_be_valid_number')
                    );
                }
                break;

            case 'float':
            case 'decimal':
                if (!is_numeric($value)) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.value_must_be_valid_decimal')
                    );
                }
                break;

            case 'boolean':
                if (!in_array($value, [true, false, 'true', 'false', 1, 0, '1', '0'])) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.value_must_be_valid_boolean')
                    );
                }
                break;

            case 'json':
                if ($value && !is_string($value)) {
                    $value = json_encode($value);
                }
                if ($value && json_decode($value) === null && json_last_error() !== JSON_ERROR_NONE) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.value_must_be_valid_json')
                    );
                }
                break;

            case 'array':
                // Allow both JSON string and comma-separated values
                if ($value) {
                    if (is_string($value)) {
                        // Try to parse as JSON first
                        $decoded = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            // Valid JSON array
                            if (empty($decoded)) {
                                $validator->errors()->add(
                                    "settings.{$index}.value",
                                    __('common.vendor_values_invalid') ?: __('common.value_must_contain_at_least_one_item')
                                );
                            }
                            break;
                        }
                        // If not JSON, treat as comma-separated
                        $values = array_map('trim', explode(',', $value));
                        if (empty(array_filter($values))) {
                            $validator->errors()->add(
                                "settings.{$index}.value",
                                __('common.vendor_values_invalid') ?: __('common.value_must_contain_at_least_one_item')
                            );
                        }
                    } elseif (!is_array($value)) {
                        $validator->errors()->add(
                            "settings.{$index}.value",
                            __('common.vendor_values_invalid') ?: __('common.value_must_be_valid_array_or_string')
                        );
                    } elseif (empty($value)) {
                        // If it's an array but empty
                        if ($settingKey && str_contains($settingKey, 'vendor') && str_contains($settingKey, 'values')) {
                            $validator->errors()->add(
                                "settings.{$index}.value",
                                __('common.vendor_values_required') ?: 'Vendor values field is required.'
                            );
                        }
                    }
                } elseif ($settingKey && str_contains($settingKey, 'vendor') && str_contains($settingKey, 'values')) {
                    // Vendor values field is required
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.vendor_values_required') ?: 'Vendor values field is required.'
                    );
                }
                break;

            case 'select':
                // For select type, we'll validate against common options
                $allowedValues = $this->getAllowedSelectValues($setting['id'] ?? null);
                if ($allowedValues && !in_array($value, $allowedValues)) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.selected_value_invalid_for_setting')
                    );
                }
                break;
        }
        
        // Additional validation for specific setting keys
        if ($settingKey) {
            // Validate support phone
            if ($settingKey === 'support_phone' && $value) {
                // Remove any non-digit characters for validation
                $phoneDigits = preg_replace('/\D/', '', $value);
                if (empty($phoneDigits) || strlen($phoneDigits) < 8) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.invalid_phone_number')
                    );
                    $validator->errors()->add(
                        $settingKey,
                        __('common.invalid_phone_number')
                    );
                }
            }
            
            // Validate support WhatsApp
            if ($settingKey === 'support_whatsapp' && $value) {
                // Remove any non-digit characters for validation
                $whatsappDigits = preg_replace('/\D/', '', $value);
                if (empty($whatsappDigits) || strlen($whatsappDigits) < 8) {
                    $validator->errors()->add(
                        "settings.{$index}.value",
                        __('common.invalid_whatsapp_number')
                    );
                    $validator->errors()->add(
                        $settingKey,
                        __('common.invalid_whatsapp_number')
                    );
                }
            }
        }
    }

    /**
     * Get allowed values for select type settings
     */
    private function getAllowedSelectValues($settingId)
    {
        // This would typically come from the database or configuration
        $selectOptions = [
            'otp_provider' => ['smsbox', 'twilio', 'email'],
            'myfatoorah_country_iso' => ['KWT', 'SAU', 'UAE', 'BHR', 'QAT', 'OMN'],
        ];

        // You would need to get the setting key from the ID
        // For now, we'll return null to allow any value
        return null;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'settings.required' => __('common.settings_data_required'),
            'settings.array' => __('common.settings_must_be_array'),
            'settings.*.id.required' => __('common.setting_id_required'),
            'settings.*.id.exists' => __('common.setting_not_found'),
            'settings.*.value.required' => __('common.setting_value_required'),
            'settings.*.type.required' => __('common.setting_type_required'),
            'settings.*.type.in' => __('common.setting_type_invalid'),
            'category.in' => __('common.category_invalid'),
        ];
    }
}