<?php

namespace App\Repositories;

use App\Contracts\VendorReportRepositoryInterface;
use App\Models\VendorReport;

class VendorReportRepository extends BaseRepository implements VendorReportRepositoryInterface
{
    protected array $searchableFields = ['reason', 'description'];
    protected array $filterableFields = ['user_id', 'vendor_id', 'service_id', 'status', 'is_active'];

    /**
     * Get reports by service
     */
    public function getByService(int $serviceId, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->model->where('service_id', $serviceId)
            ->with(['user', 'vendor', 'service'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get reports by vendor
     */
    public function getByVendor(int $vendorId, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->model->where('vendor_id', $vendorId)
            ->with(['user', 'service'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
}

