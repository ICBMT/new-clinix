<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClinicPayout extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'clinic_id',
        'payout_reference',
        'total_amount',
        'commission_deducted',
        'net_amount',
        'currency',
        'status',
        'frequency',
        'payout_date',
        'processed_at',
        'date_approved',
        'bank_reference',
        'bank_reference_id',
        'admin_notes',
        'failure_reason',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'commission_deducted' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'payout_date' => 'date',
            'processed_at' => 'datetime',
            'date_approved' => 'datetime',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(ClinicEarning::class, 'payout_id');
    }
}

