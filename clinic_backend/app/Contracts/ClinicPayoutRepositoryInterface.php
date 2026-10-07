<?php

namespace App\Contracts;

interface ClinicPayoutRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get payouts by clinic
     */
    public function getPayoutsByClinic(int $clinicId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    /**
     * Get payouts by status
     */
    public function getPayoutsByStatus(string $status, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    /**
     * Get total payouts for a clinic
     */
    public function getTotalPayoutsForClinic(int $clinicId, ?string $status = null): float;
}

