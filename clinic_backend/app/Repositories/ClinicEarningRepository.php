<?php

namespace App\Repositories;

use App\Contracts\ClinicEarningRepositoryInterface;
use App\Models\ClinicEarning;
use Illuminate\Http\Request;

class ClinicEarningRepository extends BaseRepository implements ClinicEarningRepositoryInterface
{
    protected array $searchableFields = [];
    protected array $filterableFields = ['clinic_id', 'booking_id', 'status', 'payout_id'];

    protected array $relationships = ['clinic', 'booking', 'payout'];

    /**
     * Get earnings by clinic
     */
    public function getEarningsByClinic(int $clinicId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = $this->model->where('clinic_id', $clinicId)
            ->with($this->relationships);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get earnings by status
     */
    public function getEarningsByStatus(string $status, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = $this->model->where('status', $status)
            ->with($this->relationships);

        if (isset($filters['clinic_id'])) {
            $query->where('clinic_id', $filters['clinic_id']);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get total earnings for a clinic
     */
    public function getTotalEarningsForClinic(int $clinicId, ?string $status = null): float
    {
        $query = $this->model->where('clinic_id', $clinicId);

        if ($status) {
            $query->where('status', $status);
        }

        return (float) $query->sum('net_amount');
    }
}

