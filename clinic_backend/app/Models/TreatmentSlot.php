<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreatmentSlot extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'treatment_slots';

    protected $fillable = [
        'treatment_id',
        'slot_date',
        'start_time',
        'end_time',
        'buffer_time_minutes',
        'max_bookings_per_slot',
        'slot_duration',
        'status',
        'price',
        'notes_en',
        'notes_ar',
    ];

    protected function casts(): array
    {
        return [
            'slot_date' => 'date',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'buffer_time_minutes' => 'integer',
            'max_bookings_per_slot' => 'integer',
            'slot_duration' => 'integer',
            'price' => 'decimal:2',
        ];
    }

    /**
     * Get the treatment that owns the slot
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
     * Get the booking sessions for this slot
     */
    public function bookingSessions(): HasMany
    {
        return $this->hasMany(BookingSession::class);
    }

    /**
     * Scope for available slots
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope for booked slots
     */
    public function scopeBooked($query)
    {
        return $query->where('status', 'booked');
    }

    /**
     * Scope for slots by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('slot_date', [$startDate, $endDate]);
    }

    /**
     * Scope for slots by treatment
     */
    public function scopeByTreatment($query, int $treatmentId)
    {
        return $query->where('treatment_id', $treatmentId);
    }

    /**
     * Alias for backward compatibility
     */
    public function scopeByService($query, int $serviceId)
    {
        return $this->scopeByTreatment($query, $serviceId);
    }
}