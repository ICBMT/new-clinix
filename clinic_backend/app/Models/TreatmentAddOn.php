<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentAddOn extends Model
{
    use HasFactory;

    protected $table = 'treatment_add_ons';

    protected $fillable = [
        'treatment_id',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'price',
        'currency',
        'type',
        'is_required',
        'max_quantity',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_required' => 'boolean',
            'max_quantity' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the treatment that owns this add-on
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
}

