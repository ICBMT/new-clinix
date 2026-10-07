<?php

namespace App\Models;

use App\Traits\LogsActivity;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;

class ClinicEarning extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'clinic_id',
        'booking_id',
        'gross_amount',
        'commission_rate',
        'commission_amount',
        'platform_fee',
        'fixed_charges',
        'net_amount',
        'paid_amount',
        'currency',
        'status',
        'payout_id',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'fixed_charges' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(ClinicPayout::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(EarningHistory::class, 'earning_id');
    }

    /**
     * Calculate current values based on current site settings and clinic owner's commission
     * This method calculates values without updating the database
     * 
     * @return array Calculated values: commission_rate, commission_amount, platform_fee, fixed_charges, net_amount
     */
    public function calculateCurrentValues(): array
    {
        // Load relationships if not already loaded
        if (!$this->relationLoaded('clinic')) {
            $this->load('clinic.owner');
        } elseif ($this->clinic && !$this->clinic->relationLoaded('owner')) {
            $this->clinic->load('owner');
        }

        // Get commission rate from clinic owner's admin_commission
        $clinic = $this->clinic;
        if (!$clinic) {
            // Return stored values if clinic not found
            return [
                'commission_rate' => (float) $this->commission_rate,
                'commission_amount' => (float) $this->commission_amount,
                'platform_fee' => (float) $this->platform_fee,
                'fixed_charges' => (float) $this->fixed_charges,
                'net_amount' => (float) $this->net_amount,
            ];
        }

        // Get commission rate from clinic owner's admin_commission, fallback to site settings default
        $commissionRate = 10.00; // Default fallback
        
        if ($clinic->owner && $clinic->owner->admin_commission !== null) {
            $commissionRate = (float) $clinic->owner->admin_commission;
        } else {
            // Fallback to default commission from site settings
            $commissionRate = (float) \App\Models\SiteSetting::getValue('vendor_default_commission', 10.00);
        }
        
        // Get platform fee from site settings
        $platformFeeType = \App\Models\SiteSetting::getValue('vendor_platform_fee_type', 'percentage');
        $platformFeeValue = (float) \App\Models\SiteSetting::getValue('vendor_platform_fee', 0);
        
        // Calculate amounts
        $grossAmount = (float) $this->gross_amount;
        $commissionAmount = $grossAmount * ($commissionRate / 100);
        
        // Calculate platform fee based on type
        if ($platformFeeType === 'fixed') {
            $platformFee = $platformFeeValue; // Fixed amount
        } else {
            $platformFee = $grossAmount * ($platformFeeValue / 100); // Percentage
        }
        
        $totalDeductions = $commissionAmount + $platformFee;
        $netAmount = $grossAmount - $totalDeductions;

        return [
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'platform_fee' => $platformFee,
            'fixed_charges' => 0, // Fixed charges removed - kept for backward compatibility
            'net_amount' => $netAmount,
        ];
    }

    /**
     * Recalculate earnings based on current site settings and clinic owner's commission
     */
    public function recalculate(): void
    {
        $calculated = $this->calculateCurrentValues();

        // Round all values to absolute (whole numbers) before saving
        $commissionAmount = round($calculated['commission_amount']);
        $platformFee = round($calculated['platform_fee']);
        $fixedCharges = round($calculated['fixed_charges']);
        $netAmount = round($calculated['net_amount']);

        // Update the earning
        $this->update([
            'commission_rate' => $calculated['commission_rate'],
            'commission_amount' => $commissionAmount,
            'platform_fee' => $platformFee,
            'fixed_charges' => $fixedCharges,
            'net_amount' => $netAmount,
        ]);
    }

    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Dispatch notification when earning is created
        static::created(function (ClinicEarning $earning) {
            static::dispatchEarningCreatedNotification($earning);
        });

        // Dispatch notification when earning status changes to 'paid' (approved)
        static::updated(function (ClinicEarning $earning) {
            if ($earning->isDirty('status') && $earning->status === 'paid') {
                static::dispatchEarningApprovedNotification($earning);
            }
        });
    }

    /**
     * Dispatch notification when earning is created
     */
    protected static function dispatchEarningCreatedNotification(ClinicEarning $earning): void
    {
        try {
            $earning->loadMissing(['clinic', 'booking']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyEarningCreated($earning);
            
            // Also notify super admins and users with earning approval permission
            $notificationService->notifyRolesWithPermission(
                'earnings.approve',
                'pending_earning',
                __('common.new_pending_earning'),
                __('common.new_pending_earning_ar'),
                __('common.new_pending_earning_description', [
                    'amount' => $earning->net_amount,
                    'currency' => $earning->currency,
                ]),
                __('common.new_pending_earning_description_ar', [
                    'amount' => $earning->net_amount,
                    'currency' => $earning->currency,
                ]),
                [
                    'earning_id' => $earning->id,
                    'clinic_id' => $earning->clinic_id,
                    'net_amount' => $earning->net_amount,
                    'currency' => $earning->currency,
                    'status' => $earning->status,
                ],
                $earning
            );
        } catch (\Exception $e) {
            Log::error("Failed to dispatch earning created notification for Earning ID {$earning->id}: " . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when earning is approved (status changed to 'paid')
     */
    protected static function dispatchEarningApprovedNotification(ClinicEarning $earning): void
    {
        try {
            $earning->loadMissing(['clinic', 'booking']);
            
            $notificationService = app(NotificationService::class);
            $notificationService->notifyEarningApproved($earning);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch earning approved notification for Earning ID {$earning->id}: " . $e->getMessage());
        }
    }
}

