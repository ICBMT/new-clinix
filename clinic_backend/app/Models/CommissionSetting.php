<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'commission_rate',
        'frequency',
        'is_default',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the clinic that owns this commission setting
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Get vendor (clinic owner) through clinic relationship
     */
    public function getVendorAttribute()
    {
        return $this->clinic?->owner;
    }
}

