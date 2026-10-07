<?php

namespace App\Repositories;

use App\Contracts\ClinicSubscriptionRepositoryInterface;
use App\Models\ClinicSubscription;

class ClinicSubscriptionRepository extends BaseRepository implements ClinicSubscriptionRepositoryInterface
{
    protected array $searchableFields = [
        'cancellation_reason',
    ];

    protected array $filterableFields = [
        'clinic_id',
        'subscription_package_id',
        'status',
        'auto_renew',
    ];

    public function __construct(ClinicSubscription $model)
    {
        parent::__construct($model);
    }

    /**
     * Get active subscriptions for a clinic
     */
    public function getActiveSubscriptions(int $clinicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('clinic_id', $clinicId)
            ->active()
            ->with([
                'subscriptionPackage:id,name_en,name_ar,description_en,description_ar,price,currency,billing_cycle,duration_days',
                'transaction'
            ])
            ->orderBy('end_date', 'desc')
            ->get();
    }

    /**
     * Get expired subscriptions
     */
    public function getExpiredSubscriptions(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->expired()
            ->with(['clinic', 'subscriptionPackage'])
            ->orderBy('end_date', 'desc')
            ->get();
    }
}

