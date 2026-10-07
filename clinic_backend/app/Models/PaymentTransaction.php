<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $table = 'payment_transactions';

    protected $fillable = [
        'user_id',
        'booking_id',
        'invoice_id',
        'payment_data',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'payment_data' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the payment transaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the booking associated with this payment transaction
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Scope to find by invoice ID
     */
    public function scopeByInvoiceId($query, string $invoiceId)
    {
        return $query->where('invoice_id', $invoiceId);
    }

    /**
     * Scope to get non-expired transactions
     */
    public function scopeNotExpired($query)
    {
        return $query->where('expires_at', '>', now());
    }
}

