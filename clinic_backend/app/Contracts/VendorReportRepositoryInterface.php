<?php

namespace App\Contracts;

interface VendorReportRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get reports by service
     */
    public function getByService(int $serviceId, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator;

    /**
     * Get reports by vendor
     */
    public function getByVendor(int $vendorId, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator;
}

