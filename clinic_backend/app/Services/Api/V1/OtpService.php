<?php

namespace App\Services\Api\V1;

use App\Models\Otp;
use App\Services\SiteSettingsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpService
{
    public const PROVIDER_TWILIO = 'twilio';
    public const PROVIDER_SMSBOX = 'smsbox';

    /**
     * Get OTP configuration from database
     */
    public function getOtpConfig(): array
    {
        return [
            'digits' => SiteSettingsService::getOtpDigits(),
            'expiry_minutes' => SiteSettingsService::getOtpExpiryMinutes(),
            'test_mode' => SiteSettingsService::isOtpTestMode(),
            'provider' => SiteSettingsService::getOtpProvider(),
        ];
    }

    /**
     * Generate and send OTP to the given phone number.
     */
    public function generateOtp(string $phone, ?int $customDigits = null): bool
    {
        $digits = $customDigits ?? SiteSettingsService::getOtpDigits();
        $expiryMinutes = SiteSettingsService::getOtpExpiryMinutes();
        
        // Generate test OTP or random OTP based on configuration
        if (SiteSettingsService::isOtpTestMode()) {
            $otp = str_repeat('1', $digits); // Test OTP: 1111 or 111111
        } else {
            $min = pow(10, $digits - 1);
            $max = pow(10, $digits) - 1;
            $otp = (string) rand($min, $max);
        }

        Otp::create([
            'phone' => $phone,
            'otp' => $otp,
            'expires_at' => now()->addMinutes($expiryMinutes),
        ]);

        if (SiteSettingsService::isOtpTestMode()) {
            return true;
        }

        $provider = SiteSettingsService::getOtpProvider();

        if ($provider === self::PROVIDER_TWILIO) {
            return $this->sendOtpViaTwilio($phone, $otp);
        }

        return $this->sendSmsViaSmsbox($phone, $this->buildOtpMessage($otp));
    }

    /**
     * Verify the OTP for the given phone number.
     */
    public function verifyOtp(string $phone, string $otp): bool
    {
        $otpRecord = Otp::where('phone', $phone)
            ->where('otp', $otp)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otpRecord) {
            return false;
        }

        Otp::where('phone', $phone)->delete();
        return true;
    }

    /**
     * Send SMS via SMSBox.
     */
    private function sendSmsViaSmsbox(string $phone, string $message): bool
    {
        $normalizedPhone = preg_replace('/\D/', '', $phone);

        // Only allow Kuwait numbers (965)
        if (!str_starts_with($normalizedPhone, '965')) {
            Log::error('Invalid phone number prefix for SMS', ['phone' => $phone, 'message' => $message]);
            return false;
        }

        $params = [
            'username'          => SiteSettingsService::getSmsboxUsername(),
            'password'          => SiteSettingsService::getSmsboxPassword(),
            'customerid'        => SiteSettingsService::getSmsboxCustomerId(),
            'sendertext'        => SiteSettingsService::getSmsboxSenderText(),
            'messagebody'       => $message,
            'recipientnumbers'  => $normalizedPhone,
            'defdate'           => '',
            'isblink'           => 'false',
            'isflash'           => 'false',
        ];

        try {
            $response = Http::timeout(30)->get(SiteSettingsService::getSmsboxEndpoint(), $params);

            if (!$response->successful()) {
                Log::error('SMS failed', [
                    'phone' => $phone,
                    'message' => $message,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return false;
            }

            Log::info('SMS sent successfully', [
                'phone' => $phone,
                'response' => $response->body(),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('SMSBox API Error', [
                'phone' => $phone,
                'message' => $message,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send OTP via Twilio WhatsApp (template or plain message).
     */
    private function sendOtpViaTwilio(string $phone, string $otp): bool
    {
        $templateSid = SiteSettingsService::getWhatsappOtpTemplateSid();
        $to = $this->normalizeWhatsappNumber($phone);

        if ($templateSid) {
            // Use WhatsApp template
            return $this->sendWhatsappTemplate($to, $templateSid, ['1' => $otp]);
        }

        // Fallback: plain WhatsApp message
        $fields = [
            'From' => SiteSettingsService::getTwilioWhatsappFrom(),
            'To' => $to,
            'Body' => $this->buildOtpMessage($otp),
        ];

        $url = "https://api.twilio.com/2010-04-01/Accounts/" . SiteSettingsService::getTwilioSid() . "/Messages.json";

        $response = Http::withBasicAuth(SiteSettingsService::getTwilioSid(), SiteSettingsService::getTwilioAuthToken())
            ->asForm()
            ->post($url, $fields);

        if (!$response->successful()) {
            Log::error('OTP WhatsApp via Twilio failed', [
                'phone' => $phone,
                'otp' => $otp,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return false;
        }

        return true;
    }

    /**
     * Send a WhatsApp template message via Twilio.
     */
    public function sendWhatsappTemplate(string $to, string $contentSid, array $variables = []): bool
    {
        $url = "https://api.twilio.com/2010-04-01/Accounts/" . SiteSettingsService::getTwilioSid() . "/Messages.json";

        $fields = [
            'From' => SiteSettingsService::getTwilioWhatsappFrom(),
            'To' => $to,
            'ContentSid' => $contentSid,
        ];

        if (!empty($variables)) {
            $fields['ContentVariables'] = json_encode($variables);
        }

        $response = Http::withBasicAuth(SiteSettingsService::getTwilioSid(), SiteSettingsService::getTwilioAuthToken())
            ->asForm()
            ->post($url, $fields);

        if (!$response->successful()) {
            Log::error('WhatsApp template via Twilio failed', [
                'to' => $to,
                'content_sid' => $contentSid,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return false;
        }

        return true;
    }

    /**
     * Normalize a phone number for WhatsApp API.
     */
    private function normalizeWhatsappNumber(string $phone): string
    {
        $normalized = preg_replace('/\D/', '', $phone);
        return 'whatsapp:+' . $normalized;
    }

    /**
     * Build the OTP message (can be localized if needed).
     */
    private function buildOtpMessage(string $otp): string
    {
        $appName = SiteSettingsService::get('app_name_en', 'Kuwait Admin');
        
        // Try to get translated message
        $message = __('common.api.otp.message', ['app_name' => $appName, 'otp' => $otp]);
        
        // Fallback if translation key is not found (Laravel returns the key if translation fails)
        if ($message === 'common.api.otp.message' || str_contains($message, 'common.api.otp.message')) {
            return "Your verification code for {$appName} is {$otp}";
        }
        
        return $message;
    }

    /**
     * Send a text message via SMSBox.
     */
    public function sendTextMessage(string $phone, string $message): bool
    {
        return $this->sendSmsViaSmsbox($phone, $message);
    }
}
