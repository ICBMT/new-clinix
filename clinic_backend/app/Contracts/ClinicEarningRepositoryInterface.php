<?php

namespace App\Contracts;

interface ClinicEarningRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get earnings by clinic
     */
    public function getEarningsByClinic(int $clinicId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    /**
     * Get earnings by status
     */
    public function getEarningsByStatus(string $status, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    /**
     * Get total earnings for a clinic
     */
    public function getTotalEarningsForClinic(int $clinicId, ?string $status = null): float;
}

