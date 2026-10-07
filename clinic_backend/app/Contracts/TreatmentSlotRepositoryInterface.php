<?php

namespace App\Contracts;

interface TreatmentSlotRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get available slots for a treatment
     */
    public function getAvailableSlots(int $treatmentId, ?string $date = null): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get slots by date range
     */
    public function getSlotsByDateRange(int $treatmentId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection;
}

