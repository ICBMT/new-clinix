<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'firebase' => [
        /**
         * Firebase Admin SDK credentials
         *
         * Source: site settings key "firebase_credentials_json" (type: json or textarea)
         */
        'credentials' => (function () {
            try {
                if (!class_exists(\App\Services\SiteSettingsService::class)) {
                    return null;
                }

                // Check if database connection is available
                if (!app()->bound('db') || !\Illuminate\Support\Facades\Schema::hasTable('site_settings')) {
                    return null;
                }

                $value = \App\Services\SiteSettingsService::get('firebase_credentials_json');

                // If already decoded (type=json), return as-is
                if (is_array($value)) {
                    return $value;
                }

                // If it's a string, trim whitespace from start/end before decoding
                if (is_string($value)) {
                    $clean = trim($value);

                    if ($clean !== '') {
                        $decoded = json_decode($clean, true);

                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            return $decoded;
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Silently fail if database isn't available (e.g., during wayfinder generation)
            }

            return null;
        })(),

        /**
         * Firebase Web SDK configuration
         *
         * Source: site settings key "firebase_web_config_json" (type: json or textarea)
         */
        'web_config' => (function () {
            try {
                if (!class_exists(\App\Services\SiteSettingsService::class)) {
                    return [];
                }

                // Check if database connection is available
                if (!app()->bound('db') || !\Illuminate\Support\Facades\Schema::hasTable('site_settings')) {
                    return [];
                }

                $value = \App\Services\SiteSettingsService::get('firebase_web_config_json');

                // If already decoded (type=json), return directly
                if (is_array($value)) {
                    return $value;
                }

                // If it's a string, trim whitespace from start/end before decoding
                if (is_string($value)) {
                    $clean = trim($value);

                    if ($clean !== '') {
                        $decoded = json_decode($clean, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            return $decoded;
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Silently fail if database isn't available (e.g., during wayfinder generation)
            }

            return [];
        })(),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT'),
    ],

    'otp' => [
        'test_mode' => env('OTP_TEST_MODE', true),
        'provider' => env('OTP_PROVIDER', 'smsbox'),
        'digits' => env('OTP_DIGITS', 6),
        'expiry_minutes' => env('OTP_EXPIRY_MINUTES', 5),
    ],

    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'),
        'whatsapp_otp_template_sid' => env('WHATSAPP_OTP_TEMPLATE_SID'),
    ],

    'smsbox' => [
        'username' => env('SMSBOX_USERNAME'),
        'password' => env('SMSBOX_PASSWORD'),
        'customerid' => env('SMSBOX_CUSTOMERID'),
        'sendertext' => env('SMSBOX_SENDERTEXT'),
        'endpoint' => env('SMSBOX_ENDPOINT'),
    ],

];
