<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAddOn extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'treatment_add_on_id',
        'quantity',
        'price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
    ];

    /**
     * Get the booking that owns this add-on
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the treatment add-on
     */
    public function treatmentAddOn(): BelongsTo
    {
        return $this->belongsTo(TreatmentAddOn::class, 'treatment_add_on_id');
    }

    /**
     * Alias for backward compatibility
     */
    public function service(): BelongsTo
    {
        return $this->treatmentAddOn();
    }
}
