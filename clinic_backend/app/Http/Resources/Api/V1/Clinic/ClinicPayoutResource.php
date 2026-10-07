<?php

namespace App\Http\Resources\Api\V1\Clinic;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class ClinicPayoutResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'clinic_id' => $this->clinic_id,
            'payout_reference' => $this->payout_reference,
            'total_amount' => $this->total_amount ? (float) $this->total_amount : null,
            'commission_deducted' => $this->commission_deducted ? (float) $this->commission_deducted : null,
            'net_amount' => $this->net_amount ? (float) $this->net_amount : null,
            'currency' => $this->currency,
            'status' => $this->status,
            'frequency' => $this->frequency,
            'payout_date' => $this->payout_date?->toDateString(),
            'processed_at' => $this->processed_at?->toISOString(),
            'date_approved' => $this->date_approved?->toISOString(),
            'bank_reference' => $this->bank_reference,
            'bank_reference_id' => $this->bank_reference_id,
            'admin_notes' => $this->admin_notes,
            'failure_reason' => $this->failure_reason,
            'processed_by' => $this->processed_by,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'earnings' => $this->whenLoaded('earnings', function () {
                return ClinicEarningResource::collection($this->earnings);
            }),
        ];
    }
}

