<?php

namespace App\Http\Resources\Api\V1\Clinic;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class ClinicEarningResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'clinic_id' => $this->clinic_id,
            'booking_id' => $this->booking_id,
            'gross_amount' => $this->gross_amount ? (float) $this->gross_amount : null,
            'commission_rate' => $this->commission_rate ? (float) $this->commission_rate : null,
            'commission_amount' => $this->commission_amount ? (float) $this->commission_amount : null,
            'net_amount' => $this->net_amount ? (float) $this->net_amount : null,
            'currency' => $this->currency,
            'status' => $this->status,
            'payout_id' => $this->payout_id,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

