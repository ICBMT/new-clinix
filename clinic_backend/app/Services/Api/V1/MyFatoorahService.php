<?php

namespace App\Services\Api\V1;

use App\Models\User;
use App\Services\SiteSettingsService;
use Exception;
use MyFatoorah\Library\MyFatoorah;
use MyFatoorah\Library\API\Payment\MyFatoorahPayment;
use Illuminate\Support\Str;
use MyFatoorah\Library\API\Refund\MyFatoorahRefundStatus;
use MyFatoorah\Library\API\MyFatoorahRefund;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use MyFatoorah\Library\API\Payment\MyFatoorahPaymentStatus;

class MyFatoorahService
{
    private $mfConfig;
    private $currency;

    public function __construct()
    {
        $apiKey = SiteSettingsService::getMyFatoorahApiKey();
        
        if (empty($apiKey)) {
            Log::error('MyFatoorah API key is not configured. Please set myfatoorah_api_key in site settings.');
        }
        
        // Use storage path instead of config path to avoid permission issues
        $configPath = storage_path('app/myfatoorah/mf-config.json');
        $configDir = dirname($configPath);
        
        // Ensure the directory exists and is writable
        if (!is_dir($configDir)) {
            @mkdir($configDir, 0755, true);
        }
        
        $this->mfConfig = [
            'apiKey'      => $apiKey,
            'isTest'      => SiteSettingsService::isMyFatoorahTestMode(),
            'countryCode' => config('myfatoorah.country_iso') ?? 'KW',
            'configPath' => $configPath,
        ];
        $this->currency = config('services.myfatoorah.currency', 'KWD');
    }

    public function getPaymentMethods(float $amount): array
    {
        // if ($amount <= 0) {
        //     return ['IsSuccess' => false, 'Message' => __('common.api.payment.PAYMENT_FAILED'), 'Data' => null];
        // }

        // Validate MyFatoorah configuration
        if (empty($this->mfConfig['apiKey'])) {
            Log::error('MyFatoorah API key is missing in getPaymentMethods.');
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.GATEWAY_NOT_CONFIGURED'), 'Data' => null];
        }

        if (empty($this->mfConfig['countryCode'])) {
            Log::error('MyFatoorah country code is missing in getPaymentMethods.');
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.GATEWAY_CONFIGURATION_INCOMPLETE'), 'Data' => null];
        }

        try {
            $mfObj = new MyFatoorahPayment($this->mfConfig);
            $response = $mfObj->initiatePayment($amount, $this->currency);

            if (is_array($response)) {
                return ['IsSuccess' => true, 'Message' => __('common.api.payment.PAYMENT_SUCCESS'), 'Data' => $response];
            } else {
                Log::warning('MyFatoorah getPaymentMethods unexpected response structure.', ['amount' => $amount, 'currency' => $this->currency, 'response' => $response]);
                $errorMessage = (is_object($response) && isset($response->message)) ? $response->message : __('common.api.payment.PAYMENT_METHODS_FETCH_FAILED');
                return ['IsSuccess' => false, 'Message' => $errorMessage, 'Data' => null];
            }
        } catch (Exception $ex) {
            Log::error('MyFatoorah Get Payment Methods Exception', ['error' => $ex->getMessage(), 'config' => $this->mfConfig, 'amount' => $amount, 'currency' => $this->currency]);
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.PAYMENT_METHODS_FETCH_FAILED') . ': ' . $ex->getMessage(), 'Data' => null];
        }
    }

    public function initiateRedirectPayment(User $user, float $amount, array $paymentData): array
    {
        if (!$user) {
            Log::error('InitiateRedirectPayment: User is required.');
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.INVALID_BOOKING_OR_USER'), 'Data' => null];
        }

        if ($amount <= 0) {
            Log::warning('InitiateRedirectPayment: Attempt to pay with zero or negative amount.', ['user_id' => $user->id, 'amount' => $amount]);
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.ZERO_AMOUNT_PAYMENT'), 'Data' => null];
        }

        // Validate MyFatoorah configuration
        if (empty($this->mfConfig['apiKey'])) {
            Log::error('MyFatoorah API key is missing.', ['user_id' => $user->id]);
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.GATEWAY_NOT_CONFIGURED'), 'Data' => null];
        }

        if (empty($this->mfConfig['countryCode'])) {
            Log::error('MyFatoorah country code is missing.', ['user_id' => $user->id]);
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.GATEWAY_CONFIGURATION_INCOMPLETE'), 'Data' => null];
        }

        try {
            // Generate a temporary reference for the payment (will be replaced with actual booking ID in callback)
            $tempReference = 'TEMP-' . strtoupper(uniqid());

            // Format phone number for MyFatoorah (expects 8 digits without country code)
            $customerMobile = $this->formatPhoneNumberForMyFatoorah($paymentData['CustomerMobile'] ?? '');
            
            if (empty($customerMobile)) {
                Log::warning('MyFatoorah: Invalid or missing customer mobile number.', [
                    'user_id' => $user->id,
                    'original_phone' => $paymentData['CustomerMobile'] ?? null
                ]);
                return ['IsSuccess' => false, 'Message' => __('common.invalid_phone_number'), 'Data' => null];
            }

            $postFields = [
                'PaymentMethodId'    => $paymentData['PaymentMethodId'],
                'CustomerReference'  => $tempReference,
                'InvoiceValue'       => $paymentData['InvoiceValue'],
                'CurrencyIso'        => 'KWD',
                'DisplayCurrencyIso' => 'KWD',
                'MobileCountryCode'  => '+965',
                'Language'           => 'en',
                'CallBackUrl'        => $paymentData['CallBackUrl'],
                'ErrorUrl'           => $paymentData['ErrorUrl'],
                'CustomerName'       => $paymentData['CustomerName'],
                'CustomerEmail'      => $paymentData['CustomerEmail'],
                'CustomerMobile'     => $customerMobile,
                'InvoiceItems'       => [[
                    'ItemName'  => __('common.api.payment.CART_PAYMENT'),
                    'Quantity'  => 1,
                    'UnitPrice' => $paymentData['InvoiceValue']
                ]]
            ];

            $mfObj = new MyFatoorahPayment($this->mfConfig);
            $response = $mfObj->executePayment($postFields);

            if (is_object($response) && isset($response->PaymentURL) && isset($response->InvoiceId)) {
                return [
                    'IsSuccess' => true,
                    'Message' => __('common.api.payment.PAYMENT_SUCCESS'),
                    'Data' => [
                        'InvoiceId'  => $response->InvoiceId,
                        'PaymentURL' => $response->PaymentURL,
                    ]
                ];
            } else {
                Log::error('MyFatoorah initiateRedirectPayment failed.');
                $errorMessage = (is_object($response) && isset($response->message)) ? $response->message : __('common.api.payment.PAYMENT_INITIATION_FAILED');
                Log::error('MyFatoorah initiateRedirectPayment failed.', ['user_id' => $user->id, 'postFields' => $postFields, 'response' => $response]);
                return ['IsSuccess' => false, 'Message' => $errorMessage, 'Data' => null];
            }
        } catch (Exception $ex) {
            $data = [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $ex->getMessage(),
                'trace' => $ex->getTraceAsString()
            ];
            Log::error('MyFatoorah Initiate Redirect Payment Exception', $data);
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.PAYMENT_INITIATION_FAILED'), 'Data' => $data];
        }
    }

    public function getPaymentStatus(string $paymentId): array
    {
        try {
            $mfObj = new MyFatoorahPaymentStatus($this->mfConfig);
            $response = $mfObj->getPaymentStatus($paymentId, 'PaymentId');

            if (is_object($response) && property_exists($response, 'InvoiceId')) {
                if (!empty($response->InvoiceId)) {
                    return [
                        'IsSuccess' => true,
                        'Message'   => __('common.api.payment.PAYMENT_SUCCESS'),
                        'Data'      => $response
                    ];
                } else {
                    Log::warning('MyFatoorahService: SDK response has empty InvoiceId.', [
                        'response' => $response
                    ]);
                    return [
                        'IsSuccess' => false,
                        'Message'   => __('common.api.payment.PAYMENT_STATUS_FAILED'),
                        'Data'      => null
                    ];
                }
            } elseif (is_object($response) && property_exists($response, 'IsSuccess') && $response->IsSuccess === false) {
                Log::warning('MyFatoorahService: SDK getPaymentStatus returned IsSuccess=false.', [
                    'response_message' => property_exists($response, 'Message') ? $response->Message : 'No message provided by SDK.',
                    'full_response' => $response
                ]);
                return [
                    'IsSuccess' => false,
                    'Message'   => property_exists($response, 'Message') ? $response->Message : __('common.api.payment.NO_MESSAGE_FROM_SDK'),
                    'Data'      => null
                ];
            } else {
                Log::error('MyFatoorahService: Unexpected or failed response from MyFatoorah SDK getPaymentStatus.', [
                    'response' => $response
                ]);
                return [
                    'IsSuccess' => false,
                    'Message'   => __('common.api.payment.PAYMENT_STATUS_FAILED'),
                    'Data'      => null
                ];
            }
        } catch (Exception $ex) {
            Log::error('MyFatoorah Get Payment Status Exception', ['error' => $ex->getMessage(), 'paymentId' => $paymentId]);
            return ['IsSuccess' => false, 'Message' => __('common.api.payment.PAYMENT_STATUS_FAILED') . ': ' . $ex->getMessage(), 'Data' => null];
        }
    }

    public function processRefund(string $invoiceId, float $amount, string $comment = null): array
    {
        if ($amount <= 0) {
            return ['success' => false, 'message' => __('common.api.payment.REFUND_AMOUNT_INVALID'), 'reference' => null];
        }

        try {
            $mfObj = new MyFatoorahRefund($this->mfConfig);
            $refundData = [
                'Key'       => $invoiceId,
                'KeyType'   => 'InvoiceId',
                'Amount'    => $amount,
                'Comment'   => $comment ?? __('common.api.payment.REFUND_PROCESSED')
            ];

            $result = $mfObj->makeRefund($refundData);

            if (is_object($result) && isset($result->RefundReference)) {
                return [
                    'success' => true,
                    'message' => __('common.api.payment.PAYMENT_SUCCESS'),
                    'reference' => $result->RefundReference
                ];
            } else {
                $errorMessage = (is_object($result) && isset($result->message)) ? $result->message : __('common.api.payment.REFUND_FAILED');
                Log::error('MyFatoorah Refund Failed.', ['refundData' => $refundData, 'response' => $result]);
                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'reference' => null
                ];
            }
        } catch (Exception $e) {
            Log::error('MyFatoorah Refund Exception', ['error' => $e->getMessage(), 'invoiceId' => $invoiceId, 'amount' => $amount]);
            return [
                'success' => false,
                'message' => __('common.api.payment.REFUND_FAILED') . ': ' . $e->getMessage(),
                'reference' => null
            ];
        }
    }

    /**
     * Format phone number for MyFatoorah API
     * MyFatoorah expects 8 digits without country code (since MobileCountryCode is already set)
     * 
     * @param string|null $phoneNumber
     * @return string Empty string if invalid, otherwise 8 digits
     */
    private function formatPhoneNumberForMyFatoorah(?string $phoneNumber): string
    {
        if (empty($phoneNumber)) {
            return '';
        }

        // Remove all non-digit characters
        $digits = preg_replace('/\D/', '', $phoneNumber);

        // If empty after removing non-digits, return empty
        if (empty($digits)) {
            return '';
        }

        // Remove Kuwait country code (965) if present at the start
        if (strlen($digits) >= 11 && substr($digits, 0, 3) === '965') {
            $digits = substr($digits, 3);
        }

        // MyFatoorah expects exactly 8 digits for Kuwait numbers
        // If we have more than 8 digits, take the last 8
        // If we have less than 8 digits, pad with zeros at the start (or return empty if too short)
        if (strlen($digits) < 8) {
            // If less than 8 digits, it's likely invalid
            return '';
        }

        // Take exactly 8 digits (prefer last 8 if more than 8)
        return substr($digits, -8);
    }
}
