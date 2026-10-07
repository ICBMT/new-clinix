<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Transaction extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'transaction_id',
        'transactionable_type',
        'transactionable_id',
        'type',
        'amount',
        'currency',
        'payment_method',
        'status',
        'failure_reason',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    /**
     * Get the parent transactionable model (polymorphic)
     */
    public function transactionable()
    {
        return $this->morphTo();
    }

    /**
     * Get the payment milestones for this transaction
     */
    public function paymentMilestones(): HasMany
    {
        return $this->hasMany(PaymentMilestone::class);
    }

    /**
     * Get the vendor subscriptions for this transaction
     */
    public function vendorSubscriptions(): HasMany
    {
        return $this->hasMany(VendorSubscription::class);
    }

    /**
     * Get the clinic subscriptions for this transaction
     */
    public function clinicSubscriptions(): HasMany
    {
        return $this->hasMany(ClinicSubscription::class);
    }

    /**
     * Get the media for the transaction
     */
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Scope for completed transactions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for pending transactions
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for failed transactions
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for refunded transactions
     */
    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    /**
     * Scope for transactions by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }
}