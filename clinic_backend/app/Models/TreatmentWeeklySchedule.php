<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentWeeklySchedule extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'clinic_id',
        'treatment_id',
        'day_of_week',
        'is_open',
        'closed_all_day',
        'opening_time',
        'closing_time',
        'slot_duration',
        'buffer_time_minutes',
        'max_bookings_per_slot',
        'notes_en',
        'notes_ar',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'closed_all_day' => 'boolean',
            'slot_duration' => 'integer',
            'buffer_time_minutes' => 'integer',
            'max_bookings_per_slot' => 'integer',
        ];
    }

    /**
     * Get the clinic that owns this schedule
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Get the treatment that owns this schedule
     */
    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }
}
