<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'payment_method_id',
        'payment_method_ar',
        'payment_method_en',
        'payment_method_code',
        'is_direct_payment',
        'service_charge',
        'total_amount',
        'currency_iso',
        'image_url',
        'is_embedded_supported',
        'payment_currency_iso',
        'status',
        'is_ios_supported',
        'is_android_supported',
        'is_web_supported',
    ];

    protected function casts(): array
    {
        return [
            'is_direct_payment' => 'boolean',
            'service_charge' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'is_embedded_supported' => 'boolean',
            'is_ios_supported' => 'boolean',
            'is_android_supported' => 'boolean',
            'is_web_supported' => 'boolean',
        ];
    }

    /**
     * Get a meaningful name for the model, fallback to ID if no meaningful name
     */
    public function getName()
    {
        return $this->payment_method_en ?: $this->payment_method_ar ?: "Payment Method #{$this->id}";
    }

    /**
     * Scope for active payment methods
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for platform-specific support
     */
    public function scopeForPlatform($query, $platform)
    {
        switch ($platform) {
            case 'ios':
                return $query->where('is_ios_supported', true);
            case 'android':
                return $query->where('is_android_supported', true);
            case 'web':
                return $query->where('is_web_supported', true);
            default:
                return $query;
        }
    }

    /**
     * Get localized name based on locale
     */
    public function getLocalizedName($locale = 'en')
    {
        return $locale === 'ar' ? $this->payment_method_ar : $this->payment_method_en;
    }
}