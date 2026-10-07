<?php

namespace App\Contracts;

interface GovernorateRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active governorates with nested areas
     */
    public function getActiveGovernoratesWithAreas(): \Illuminate\Database\Eloquent\Collection;
}

