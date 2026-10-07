<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BodyPart extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the bookings with this body part
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'patient_body_part_id');
    }

    /**
     * Scope for active body parts
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for ordered body parts
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('name_en', 'asc');
    }
}
