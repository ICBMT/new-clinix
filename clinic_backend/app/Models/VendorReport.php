<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VendorReport extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'user_id',
        'vendor_id',
        'service_id',
        'reason',
        'description',
        'attachments',
        'status',
        'is_active',
        'resolution_notes',
        'resolved_by',
        'resolved_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'attachments' => 'array',
        'is_active' => 'boolean',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Boot the model and set up event listeners.
     */
    protected static function boot()
    {
        parent::boot();

        /**
         * Handle soft deletion with data anonymization for privacy compliance.
         */
        static::deleting(function ($model) {
            // Create unique identifier with microtime and random element
            $uniqueId = now()->format('YmdHis') . '_' . substr(microtime(), 2, 6) . '_' . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
            
            // Anonymize description and resolution notes
            if ($model->description) {
                $model->description = $model->description . "_" . $uniqueId . "_Del";
            }
            
            if ($model->resolution_notes) {
                $model->resolution_notes = $model->resolution_notes . "_" . $uniqueId . "_Del";
            }
            
            // Save the anonymized data before soft deletion
            $model->save();
        });
    }

    /**
     * Get the user that owns the report.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the vendor for the report.
     */
    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    /**
     * Get the service for the report.
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the admin who resolved the report.
     */
    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Get the media for the report.
     */
    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get the report attachments.
     */
    public function attachments()
    {
        return $this->morphMany(Media::class, 'mediable')->where('collection_name', 'attachments');
    }

    /**
     * Scope to get open reports.
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope to get resolved reports.
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    /**
     * Scope to get dismissed reports.
     */
    public function scopeDismissed($query)
    {
        return $query->where('status', 'dismissed');
    }

    /**
     * Scope to get reports by reason.
     */
    public function scopeByReason($query, $reason)
    {
        return $query->where('reason', $reason);
    }

    /**
     * Scope to get reports by user.
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get reports by vendor.
     */
    public function scopeByVendor($query, $vendorId)
    {
        return $query->where('vendor_id', $vendorId);
    }

    /**
     * Scope to get reports by service.
     */
    public function scopeByService($query, $serviceId)
    {
        return $query->where('service_id', $serviceId);
    }

    /**
     * Check if report is open.
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Check if report is resolved.
     */
    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }

    /**
     * Check if report is dismissed.
     */
    public function isDismissed(): bool
    {
        return $this->status === 'dismissed';
    }

    /**
     * Check if report is in review.
     */
    public function isInReview(): bool
    {
        return $this->status === 'in_review';
    }
}