<?php

namespace App\Repositories;

use App\Contracts\ClinicPayoutRepositoryInterface;
use App\Models\ClinicPayout;

class ClinicPayoutRepository extends BaseRepository implements ClinicPayoutRepositoryInterface
{
    protected array $searchableFields = ['payout_reference', 'bank_reference', 'bank_reference_id', 'admin_notes'];
    protected array $filterableFields = ['clinic_id', 'status', 'frequency', 'processed_by'];

    protected array $relationships = [
        'clinic:id,name_en,name_ar,email',
        'clinic.owner:id,name,email',
        'processedBy:id,name,email',
        'earnings',
    ];

    /**
     * Get payouts by clinic
     */
    public function getPayoutsByClinic(int $clinicId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = $this->model->where('clinic_id', $clinicId)
            ->with($this->relationships);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('payout_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('payout_date', '<=', $filters['date_to']);
        }

        return $query->orderBy('payout_date', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get payouts by status
     */
    public function getPayoutsByStatus(string $status, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = $this->model->where('status', $status)
            ->with($this->relationships);

        if (isset($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }

        return $query->orderBy('payout_date', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get total payouts for a clinic
     */
    public function getTotalPayoutsForClinic(int $clinicId, ?string $status = null): float
    {
        $query = $this->model->where('clinic_id', $clinicId);

        if ($status) {
            $query->where('status', $status);
        }

        return (float) $query->sum('net_amount');
    }
}

