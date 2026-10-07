<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarningHistory extends Model
{
    use HasFactory;

    protected $table = 'earning_history';

    protected $fillable = [
        'earning_id',
        'payout_id',
        'payout_reference',
        'amount_paid',
        'remaining_amount_before',
        'remaining_amount_after',
        'currency',
        'notes',
        'processed_by',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'remaining_amount_before' => 'decimal:2',
            'remaining_amount_after' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function earning(): BelongsTo
    {
        return $this->belongsTo(ClinicEarning::class, 'earning_id');
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(ClinicPayout::class, 'payout_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
