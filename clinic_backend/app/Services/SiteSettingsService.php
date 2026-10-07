<?php

namespace App\Services;

use App\Models\SiteSetting;

class SiteSettingsService
{
    /**
     * Get a site setting value by key
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        $setting = SiteSetting::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }
        
        return $setting->getTypedValue();
    }
    
    /**
     * Get multiple site settings by keys
     *
     * @param array $keys
     * @return array
     */
    public static function getMultiple(array $keys): array
    {
        $settings = SiteSetting::whereIn('key', $keys)->get();
        $result = [];
        
        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->getTypedValue();
        }
        
        return $result;
    }
    
    /**
     * Get all OTP-related settings
     *
     * @return array
     */
    public static function getOtpSettings(): array
    {
        return self::getMultiple([
            'otp_test_mode',
            'otp_provider',
            'otp_digits',
            'otp_expiry_minutes',
        ]);
    }
    
    /**
     * Get all SMSBox settings
     *
     * @return array
     */
    public static function getSmsboxSettings(): array
    {
        return self::getMultiple([
            'smsbox_username',
            'smsbox_password',
            'smsbox_customerid',
            'smsbox_sendertext',
            'smsbox_endpoint',
        ]);
    }
    
    /**
     * Get all Twilio settings
     *
     * @return array
     */
    public static function getTwilioSettings(): array
    {
        return self::getMultiple([
            'twilio_sid',
            'twilio_auth_token',
            'twilio_whatsapp_from',
            'whatsapp_otp_template_sid',
        ]);
    }
    
    /**
     * Get all MyFatoorah settings
     *
     * @return array
     */
    public static function getMyFatoorahSettings(): array
    {
        return self::getMultiple([
            'myfatoorah_api_key',
            'myfatoorah_test_mode',
        ]);
    }
    
    /**
     * Get all Firebase settings
     *
     * @return array
     */
    public static function getFirebaseSettings(): array
    {
        return self::getMultiple([
            'firebase_server_key',
            'firebase_sender_id',
            'firebase_project_id',
        ]);
    }
    
    /**
     * Get all Google OAuth settings
     *
     * @return array
     */
    public static function getGoogleSettings(): array
    {
        return self::getMultiple([
            'google_client_id',
            'google_client_secret',
            'google_redirect_uri',
        ]);
    }
    
    /**
     * Get Google Maps API key
     *
     * @return string
     */
    public static function getGoogleMapsApiKey(): string
    {
        return (string) self::get('google_maps_api_key', '');
    }
    
    /**
     * Get all Apple Sign In settings
     *
     * @return array
     */
    public static function getAppleSettings(): array
    {
        return self::getMultiple([
            'apple_client_id',
            'apple_team_id',
            'apple_key_id',
            'apple_private_key',
        ]);
    }
    
    /**
     * Check if OTP test mode is enabled
     *
     * @return bool
     */
    public static function isOtpTestMode(): bool
    {
        return self::get('otp_test_mode', false);
    }
    
    /**
     * Get OTP provider
     *
     * @return string
     */
    public static function getOtpProvider(): string
    {
        return self::get('otp_provider', 'smsbox');
    }
    
    /**
     * Get OTP digits count
     *
     * @return int
     */
    public static function getOtpDigits(): int
    {
        return (int) self::get('otp_digits', 4);
    }
    
    /**
     * Get OTP expiry minutes
     *
     * @return int
     */
    public static function getOtpExpiryMinutes(): int
    {
        return (int) self::get('otp_expiry_minutes', 5);
    }
    
    /**
     * Check if MyFatoorah test mode is enabled
     *
     * @return bool
     */
    public static function isMyFatoorahTestMode(): bool
    {
        return self::get('myfatoorah_test_mode', true);
    }
    
    /**
     * Get MyFatoorah API key
     *
     * @return string|null
     */
    public static function getMyFatoorahApiKey(): ?string
    {
        return self::get('myfatoorah_api_key');
    }
    
    /**
     * Get SMSBox username
     *
     * @return string|null
     */
    public static function getSmsboxUsername(): ?string
    {
        return self::get('smsbox_username');
    }
    
    /**
     * Get SMSBox password
     *
     * @return string|null
     */
    public static function getSmsboxPassword(): ?string
    {
        return self::get('smsbox_password');
    }
    
    /**
     * Get SMSBox customer ID
     *
     * @return string|null
     */
    public static function getSmsboxCustomerId(): ?string
    {
        return self::get('smsbox_customerid');
    }
    
    /**
     * Get SMSBox sender text
     *
     * @return string|null
     */
    public static function getSmsboxSenderText(): ?string
    {
        return self::get('smsbox_sendertext');
    }
    
    /**
     * Get SMSBox endpoint
     *
     * @return string|null
     */
    public static function getSmsboxEndpoint(): ?string
    {
        return self::get('smsbox_endpoint');
    }
    
    /**
     * Get Twilio SID
     *
     * @return string|null
     */
    public static function getTwilioSid(): ?string
    {
        return self::get('twilio_sid');
    }
    
    /**
     * Get Twilio Auth Token
     *
     * @return string|null
     */
    public static function getTwilioAuthToken(): ?string
    {
        return self::get('twilio_auth_token');
    }
    
    /**
     * Get Twilio WhatsApp from number
     *
     * @return string|null
     */
    public static function getTwilioWhatsappFrom(): ?string
    {
        return self::get('twilio_whatsapp_from');
    }
    
    /**
     * Get WhatsApp OTP template SID
     *
     * @return string|null
     */
    public static function getWhatsappOtpTemplateSid(): ?string
    {
        return self::get('whatsapp_otp_template_sid');
    }

    /**
     * Get localized site setting value based on current locale
     * Tries locale-specific key first, then falls back to English, then default
     *
     * @param string $key Base key (without locale suffix)
     * @param mixed $default Default value if not found
     * @param string|null $locale Optional locale override (defaults to app locale)
     * @return mixed
     */
    public static function getLocalized(string $key, $default = null, ?string $locale = null): mixed
    {
        $locale = $locale ?? app()->getLocale() ?? 'en';
        $locale = strtolower(substr($locale, 0, 2)); // Extract 'en' or 'ar'
        
        $localizedKey = $key . '_' . $locale;
        $fallbackKey = $key . '_en';

        return self::get($localizedKey) ?? self::get($fallbackKey) ?? $default;
    }

    /**
     * Get rescheduling buffer time in hours
     *
     * @return int
     */
    public static function getReschedulingBufferHours(): int
    {
        // Check new key first, then legacy key for backward compatibility
        $value = self::get('booking_rescheduling_buffer_hours');
        return $value !== null ? (int) $value : (int) self::get('rescheduling_buffer_hours', 24);
    }

    /**
     * Get cancellation buffer time in hours
     *
     * @return int
     */
    public static function getCancellationBufferHours(): int
    {
        return (int) self::get('booking_cancellation_buffer_hours', 24);
    }

    /**
     * Get customer cancellation penalty type (fixed or percentage)
     *
     * @return string
     */
    public static function getUserCancellationPenaltyType(): string
    {
        return self::get('booking_user_cancellation_penalty_type', 'percentage');
    }

    /**
     * Get customer cancellation penalty value
     *
     * @return float
     */
    public static function getUserCancellationPenaltyValue(): float
    {
        return (float) self::get('booking_user_cancellation_penalty_value', 5);
    }

    /**
     * Get user cancellation platform charge percentage (legacy - use getUserCancellationPenaltyType/Value)
     *
     * @return float
     */
    public static function getUserCancellationPlatformChargePercentage(): float
    {
        // Check new penalty system first
        $penaltyType = self::getUserCancellationPenaltyType();
        if ($penaltyType === 'percentage') {
            return self::getUserCancellationPenaltyValue();
        }
        
        // Fall back to legacy keys
        $value = self::get('booking_user_cancellation_platform_charge_percentage');
        return $value !== null ? (float) $value : (float) self::get('user_cancellation_platform_charge_percentage', 5);
    }

    /**
     * Get clinic/vendor refund policy type (full, partial, or fixed)
     *
     * @return string
     */
    public static function getClinicRefundPolicyType(): string
    {
        // Check new key first, then legacy key for backward compatibility
        $value = self::get('booking_vendor_refund_policy_type');
        return $value !== null ? $value : self::get('clinic_refund_policy_type', 'partial');
    }

    /**
     * Get clinic/vendor refund policy value (percentage for partial/full, fixed amount for fixed)
     *
     * @return float
     */
    public static function getClinicRefundPolicyValue(): float
    {
        // Check new key first, then legacy key for backward compatibility
        $value = self::get('booking_vendor_refund_policy_value');
        return $value !== null ? (float) $value : (float) self::get('booking_vendor_refund_policy_percentage') ?? (float) self::get('clinic_refund_policy_percentage', 20);
    }

    /**
     * Get clinic/vendor refund policy percentage (legacy - use getClinicRefundPolicyValue)
     *
     * @return float
     */
    public static function getClinicRefundPolicyPercentage(): float
    {
        $policyType = self::getClinicRefundPolicyType();
        if (in_array($policyType, ['full', 'partial'])) {
            return self::getClinicRefundPolicyValue();
        }
        
        // For fixed type, return 0 as percentage doesn't apply
        return 0;
    }
}
