<?php

namespace App\Contracts;

interface AreaRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active areas by governorate
     */
    public function getActiveAreasByGovernorate(int $governorateId): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get all active areas
     */
    public function getActiveAreas(): \Illuminate\Database\Eloquent\Collection;
}

