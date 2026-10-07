<?php

namespace App\Http\Resources\Api\V1\Clinic;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Subscription\SubscriptionPackageResource;
use Illuminate\Http\Request;

class ClinicSubscriptionResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'clinic_id' => $this->clinic_id,
            'subscription_package_id' => $this->subscription_package_id,
            'transaction_id' => $this->transaction_id,
            'amount_paid' => $this->amount_paid ? (float) $this->amount_paid : null,
            'currency' => $this->currency,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'auto_renew' => $this->auto_renew,
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'subscription_package' => $this->whenLoaded('subscriptionPackage', function () {
                return new SubscriptionPackageResource($this->subscriptionPackage);
            }),
        ];
    }
}

