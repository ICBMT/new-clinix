<?php

namespace App\Contracts;

interface ClinicOperatingHourRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get operating hours by clinic
     */
    public function getOperatingHoursByClinic(int $clinicId): \Illuminate\Database\Eloquent\Collection;

    /**
     * Update or create operating hours for a clinic
     */
    public function updateOrCreateOperatingHours(int $clinicId, array $operatingHours): void;

    /**
     * Get operating hours for a specific day
     */
    public function getOperatingHoursForDay(int $clinicId, string $dayOfWeek): ?\App\Models\ClinicOperatingHour;
}

