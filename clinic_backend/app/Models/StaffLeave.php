<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffLeave extends Model
{
    use LogsActivity;

    public const TYPES = ['annual', 'sick', 'unpaid', 'other'];
    public const STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

    protected $fillable = ['clinic_id', 'staff_id', 'leave_type', 'start_date', 'end_date', 'reason', 'status'];

    protected function casts(): array
    {
        return ['start_date' => 'date:Y-m-d', 'end_date' => 'date:Y-m-d'];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function staff(): BelongsTo
    {
        // Retain the staff name on historical leave records after soft deletion.
        return $this->belongsTo(User::class, 'staff_id')->withTrashed();
    }

    public function scopeAccessibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole('super-admin')) {
            return $query;
        }

        // An empty set must never mean unrestricted access.
        return $query->whereIn('clinic_id', $user->getAccessibleClinicIds());
    }
}
