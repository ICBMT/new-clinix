<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use App\Jobs\SendPushNotification;

class Booking extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'booking_reference',
        'user_id',
        'clinic_id',
        'treatment_id',
        'machine_id',
        'total_sessions',
        'base_price',
        'subtotal',
        'tax_amount',
        'total_amount',
        'currency',
        'payment_type',
        'deposit_amount',
        'balance_amount',
        'balance_due_date',
        'status',
        'payment_status',
        'special_instructions',
        'notes',
        'cancellation_reason',
        'cancellation_reason_id',
        'reschedule_reason',
        'reschedule_reason_id',
        'rejection_reason',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
        'rejected_at',
        'medical_notes',
        'medical_questionnaire',
        'medical_record_ids',
        'follow_up_booking_id',
        'reschedule_count',
        'cancellation_count',
        'documents_count',
        'payment_transaction_id',
        'payment_gateway',
        'refund_amount',
        'refund_reason',
        'refunded_at',
        'booking_source',
        'internal_notes',
        'is_reminder_sent',
        'reminder_sent_at',
        'is_review_provided',
        'review_provided_at',
        'patient_name',
        'patient_phone',
        'patient_age',
        'patient_gender',
        'patient_skin_type_id',
        'patient_body_part_id',
    ];

    protected $casts = [
        'total_sessions' => 'integer',
        'base_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'balance_due_date' => 'date',
        'confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'rejected_at' => 'datetime',
        'medical_questionnaire' => 'array',
        'medical_record_ids' => 'array',
        'reschedule_count' => 'integer',
        'cancellation_count' => 'integer',
        'documents_count' => 'integer',
        'refund_amount' => 'decimal:2',
        'refunded_at' => 'datetime',
        'is_reminder_sent' => 'boolean',
        'reminder_sent_at' => 'datetime',
            'is_review_provided' => 'boolean',
            'review_provided_at' => 'datetime',
        'patient_age' => 'integer',
    ];

    /**
     * Get the user that owns the booking
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the clinic for the booking
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    /**
     * Alias for backward compatibility
     */
    public function vendor(): BelongsTo
    {
        // Return clinic owner as vendor for backward compatibility
        return $this->belongsTo(User::class, 'vendor_id');
    }

    /**
     * Get the treatment for the booking
     */
    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    /**
     * Alias for backward compatibility
     */
    public function service(): BelongsTo
    {
        return $this->treatment();
    }

    /**
     * Get the booking sessions for this booking
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(BookingSession::class);
    }

    /**
     * Get the machine for the booking (optional)
     */
    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    /**
     * Get the patient skin type for the booking
     */
    public function patientSkinType(): BelongsTo
    {
        return $this->belongsTo(SkinType::class, 'patient_skin_type_id');
    }

    /**
     * Get the patient body part for the booking
     */
    public function patientBodyPart(): BelongsTo
    {
        return $this->belongsTo(BodyPart::class, 'patient_body_part_id');
    }

    /**
     * Get the treatment slot for the booking
     */
    public function treatmentSlot(): BelongsTo
    {
        return $this->belongsTo(TreatmentSlot::class, 'treatment_slot_id');
    }

    /**
     * Alias for backward compatibility
     */
    public function serviceSlot(): BelongsTo
    {
        return $this->treatmentSlot();
    }

    /**
     * Get the address for the booking
     */
    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    /**
     * Get the documents for the booking
     */
    public function documents(): HasMany
    {
        return $this->hasMany(BookingDocument::class);
    }

    /**
     * Get the follow-up booking
     */
    public function followUpBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'follow_up_booking_id');
    }

    /**
     * Get bookings that are follow-ups to this booking
     */
    public function followUpBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'follow_up_booking_id');
    }

    /**
     * Get clinic earnings for this booking
     */
    public function clinicEarnings(): HasMany
    {
        return $this->hasMany(ClinicEarning::class);
    }

    /**
     * Get refunds for this booking
     */
    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /**
     * Get the reviews for the booking
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the transactions for the booking (polymorphic)
     */
    public function transactions(): MorphMany
    {
        return $this->morphMany(Transaction::class, 'transactionable');
    }

    /**
     * Get the media for the booking
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get the add-ons for the booking
     */
    public function addOns(): HasMany
    {
        return $this->hasMany(BookingAddOn::class);
    }

    /**
     * Scope for confirmed bookings
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'accepted'); // Use 'accepted' to match enum values
    }

    /**
     * Get the cancellation reason for the booking
     */
    public function cancellationReason(): BelongsTo
    {
        return $this->belongsTo(BookingReason::class, 'cancellation_reason_id');
    }

    /**
     * Get medical records relationship using medical_record_ids JSON column
     * Since medical_record_ids is a JSON array, we query Media by IDs
     */
    public function medicalRecords()
    {
        // Get the IDs from the JSON column
        $ids = $this->medical_record_ids ?? [];
        
        if (!is_array($ids) || empty($ids)) {
            // Return empty collection if no IDs
            return Media::whereRaw('1 = 0');
        }
        
        // Query Media by the IDs stored in medical_record_ids
        return Media::whereIn('id', $ids)
            ->where('collection_name', 'medical-records');
    }

    /**
     * Get the reschedule reason for the booking
     */
    public function rescheduleReason(): BelongsTo
    {
        return $this->belongsTo(BookingReason::class, 'reschedule_reason_id');
    }

    /**
     * Scope for completed bookings
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for cancelled bookings
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope for paid bookings
     */
    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    /**
     * Scope for bookings by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereHas('sessions', function($q) use ($startDate, $endDate) {
            $q->whereBetween('slot_date', [$startDate, $endDate]);
        });
    }

    /**
     * Mark booking as completed and generate vendor earnings
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Generate clinic earning if booking is paid and earning doesn't exist
        if ($this->payment_status === 'paid' && !$this->clinicEarnings()->exists()) {
            $this->generateClinicEarning();
        }
    }

    /**
     * Generate clinic earning for this booking
     */
    public function generateClinicEarning(): void
    {
        // Check if earning already exists
        if ($this->clinicEarnings()->exists()) {
            return;
        }

        // Only generate earning for paid bookings
        if ($this->payment_status !== 'paid') {
            return;
        }

        // Get commission rate from clinic owner's admin_commission
        $commissionRate = $this->getCommissionRate();
        
        // Get platform fee from site settings
        $platformFeeType = \App\Models\SiteSetting::getValue('vendor_platform_fee_type', 'percentage'); // 'percentage' or 'fixed'
        $platformFeeValue = (float) \App\Models\SiteSetting::getValue('vendor_platform_fee', 0);
        
        // Calculate amounts
        $grossAmount = (float) $this->total_amount;
        $commissionAmount = $grossAmount * ($commissionRate / 100); // commission_rate is stored as percentage (e.g., 10.00 for 10%)
        
        // Calculate platform fee based on type
        if ($platformFeeType === 'fixed') {
            $platformFee = $platformFeeValue; // Fixed amount
        } else {
            $platformFee = $grossAmount * ($platformFeeValue / 100); // Percentage
        }
        
        $totalDeductions = $commissionAmount + $platformFee;
        $netAmount = $grossAmount - $totalDeductions;

        // Round all values to absolute (whole numbers) before saving
        $grossAmount = round($grossAmount);
        $commissionAmount = round($commissionAmount);
        $platformFee = round($platformFee);
        $netAmount = round($netAmount);

        // Create clinic earning
        \App\Models\ClinicEarning::create([
            'clinic_id' => $this->clinic_id,
            'booking_id' => $this->id,
            'gross_amount' => $grossAmount,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'platform_fee' => $platformFee,
            'fixed_charges' => 0, // Fixed charges removed - kept for backward compatibility
            'net_amount' => $netAmount,
            'currency' => $this->currency ?? 'KWD',
            'status' => 'pending',
        ]);
    }

    /**
     * Get commission rate for this booking's clinic
     * Returns clinic owner's admin_commission from users table, or default from site settings
     */
    private function getCommissionRate(): float
    {
        // Load clinic with owner if not already loaded
        if (!$this->relationLoaded('clinic')) {
            $this->load('clinic.owner');
        } else {
            // Clinic is loaded, check if owner is loaded
            if ($this->clinic && !$this->clinic->relationLoaded('owner')) {
                $this->clinic->load('owner');
            }
        }

        // Get admin_commission from clinic owner (users table)
        if ($this->clinic && $this->clinic->owner && $this->clinic->owner->admin_commission !== null) {
            return (float) $this->clinic->owner->admin_commission;
        }

        // Fallback to default commission from site settings
        $defaultCommission = (float) \App\Models\SiteSetting::getValue('vendor_default_commission', 10.00);
        return $defaultCommission;
    }


    /**
     * Boot the model and set up event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Dispatch notification when booking is created
        static::created(function (Booking $booking) {
            static::dispatchBookingCreatedNotification($booking);
        });

        static::updated(function (Booking $booking) {
            $isStatusChange = $booking->isDirty('status');
            $isPaymentStatusChange = $booking->isDirty('payment_status');

            if ($isStatusChange) {
                $newStatus = $booking->status;
                $oldStatus = $booking->getOriginal('status');

                // Dispatch notification for status change
                static::dispatchBookingStatusChangeNotification($booking, $oldStatus, $newStatus);

                // Generate clinic earning when booking is marked as completed
                if ($newStatus === 'completed' && $booking->payment_status === 'paid') {
                    $booking->generateClinicEarning();
                }
            }

            // Generate clinic earning when payment status changes to 'paid' and booking is already completed
            if ($isPaymentStatusChange && $booking->payment_status === 'paid' && $booking->status === 'completed') {
                $booking->generateClinicEarning();
            }
        });
    }

    /**
     * Dispatch notification when booking is created
     */
    protected static function dispatchBookingCreatedNotification(Booking $booking): void
    {
        try {
            $booking->loadMissing(['user', 'clinic', 'treatment']);
            
            if (!$booking->user) {
                return;
            }

            $notificationService = app(NotificationService::class);
            
            // Notify clinic owner
            $notificationService->notifyBookingCreated($booking);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch booking created notification for Booking ID {$booking->id}: " . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when booking status changes
     */
    protected static function dispatchBookingStatusChangeNotification(Booking $booking, string $oldStatus, string $newStatus): void
    {
        try {
            $booking->loadMissing(['user', 'clinic', 'treatment']);
            
            if (!$booking->user) {
                return;
            }

            $notificationService = app(NotificationService::class);
            $notificationService->notifyBookingStatusUpdated($booking, $oldStatus, $newStatus);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch booking status change notification for Booking ID {$booking->id}: " . $e->getMessage());
        }
    }

}