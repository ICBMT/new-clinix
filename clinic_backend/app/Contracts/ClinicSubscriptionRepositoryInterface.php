<?php

namespace App\Contracts;

interface ClinicSubscriptionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active subscriptions for a clinic
     */
    public function getActiveSubscriptions(int $clinicId): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get expired subscriptions
     */
    public function getExpiredSubscriptions(): \Illuminate\Database\Eloquent\Collection;
}

