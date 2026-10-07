<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = ['key', 'value', 'type', 'description'];

    /**
     * Get the value for a specific key
     */
    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->getTypedValue() : $default;
    }

    /**
     * Set setting value by key
     */
    public static function setValue($key, $value, $type = 'text')
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type]
        );
    }

    /**
     * Get value with proper type casting
     */
    public function getTypedValue()
    {
        $value = $this->value;
        
        // Convert image paths to full URLs for logo, favicon, and contact images
        $imageFields = ['app_logo', 'app_favicon', 'contact_email_image', 'contact_phone_image', 
                       'contact_address_image', 'contact_whatsapp_image', 'contact_facebook_image', 
                       'contact_twitter_image', 'contact_linkedin_image', 'contact_instagram_image'];
        
        if (in_array($this->key, $imageFields) && $value) {
            // If it's already a full URL, return it
            if (filter_var($value, FILTER_VALIDATE_URL)) {
                return $value;
            }
            
            // Remove leading /storage/ if present to avoid duplication
            $value = ltrim($value, '/');
            if (str_starts_with($value, 'storage/')) {
                $value = substr($value, 8); // Remove 'storage/' prefix
            }
            
            // Return the storage URL
            return asset('storage/' . $value);
        }
        
        switch ($this->type) {
            case 'boolean':
                return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
            case 'number':
            case 'integer':
                return is_numeric($this->value) ? (int) $this->value : 0;
            case 'float':
            case 'decimal':
                return is_numeric($this->value) ? (float) $this->value : 0.0;
            case 'json':
                return json_decode($this->value, true) ?? [];
            case 'array':
                return is_string($this->value) ? explode(',', $this->value) : (array) $this->value;
            default:
                return $this->value;
        }
    }

    /**
     * Get settings grouped by category
     */
    public static function getGroupedSettings()
    {
        $settings = self::all();
        $grouped = [];

        foreach ($settings as $setting) {
            $category = self::getCategoryFromKey($setting->key);
            $grouped[$category][] = $setting;
        }

        return $grouped;
    }

    /**
     * Get category from setting key
     */
    public static function getCategoryFromKey($key)
    {
        if (str_starts_with($key, 'app_') || str_starts_with($key, 'activity_')) {
            return 'general';
        } elseif (str_starts_with($key, 'vendor_')) {
            return 'vendor';
        } elseif (str_starts_with($key, 'contact_')) {
            return 'contact';
        } elseif (str_starts_with($key, 'terms_')) {
            return 'terms';
        } elseif (str_starts_with($key, 'privacy_')) {
            return 'privacy';
        } elseif (str_starts_with($key, 'loyalty_')) {
            return 'loyalty';
        } elseif (str_starts_with($key, 'firebase_')) {
            return 'firebase';
        } elseif (str_starts_with($key, 'otp_') || str_starts_with($key, 'twilio_') || str_starts_with($key, 'whatsapp_') || str_starts_with($key, 'smsbox_')) {
            return 'communication';
        } elseif (str_starts_with($key, 'myfatoorah_')) {
            return 'myfatoorah';
        } elseif (str_starts_with($key, 'support_')) {
            return 'support';
        } elseif (str_starts_with($key, 'booking_') || 
                  $key === 'rescheduling_buffer_hours' || 
                  $key === 'cancellation_buffer_hours' ||
                  $key === 'user_cancellation_platform_charge_percentage' ||
                  $key === 'clinic_refund_policy_type' ||
                  $key === 'clinic_refund_policy_percentage') {
            return 'booking';
        }

        return 'general';
    }

    /**
     * Get settings by category
     */
    public static function getByCategory($category)
    {
        $settings = self::all();
        $filtered = [];

        foreach ($settings as $setting) {
            if (self::getCategoryFromKey($setting->key) === $category) {
                $filtered[] = $setting;
            }
        }

        return collect($filtered);
    }

    /**
     * Get available categories
     */
    public static function getCategories()
    {
        return [
            'general' => __('common.general_settings'),
            'vendor' => __('common.vendor_settings'),
            'contact' => __('common.contact_us_settings'),
            'terms' => __('common.terms_conditions'),
            'privacy' => __('common.privacy_policy'),
            'loyalty' => __('common.loyalty_settings'),
            'communication' => __('common.communication_settings'),
            'myfatoorah' => __('common.myfatoorah_payment_settings'),
            'support' => __('common.contact_support_settings'),
            'firebase' => __('common.firebase_settings'),
            'booking' => __('common.booking_settings'),
        ];
    }
}