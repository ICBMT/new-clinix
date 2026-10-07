<?php

namespace App\Models;

use App\Enums\BookingReasonType;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingReason extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'type',
        'title_en',
        'title_ar',
        'description_en',
        'description_ar',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => BookingReasonType::class,
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Scope reasons by type.
     */
    public function scopeOfType($query, BookingReasonType|string $type)
    {
        $value = $type instanceof BookingReasonType ? $type->value : $type;

        return $query->where('type', $value);
    }

    /**
     * Scope active reasons.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope ordered reasons.
     */
    public function scopeOrdered($query)
    {
        return $query
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /**
     * Get bookings with this cancellation reason
     */
    public function cancellationBookings()
    {
        return $this->hasMany(Booking::class, 'cancellation_reason_id');
    }

    /**
     * Get bookings with this reschedule reason
     */
    public function rescheduleBookings()
    {
        return $this->hasMany(Booking::class, 'reschedule_reason_id');
    }
}


