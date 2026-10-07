<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicOperatingHour extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'clinic_id',
        'day_of_week',
        'is_open',
        'closed_all_day',
        'opening_time',
        'closing_time',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'closed_all_day' => 'boolean',
            'opening_time' => 'datetime:H:i',
            'closing_time' => 'datetime:H:i',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }
}

