<?php

namespace App\Http\Resources\Api\V1\Transaction;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Booking\BookingResource;
use App\Http\Resources\Api\V1\Media\MediaResource;
use Illuminate\Http\Request;

class TransactionResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_id' => $this->transaction_id,
            'transactionable_type' => $this->transactionable_type,
            'transactionable_id' => $this->transactionable_id,
            'type' => $this->type,
            'amount' => $this->amount ? (float) $this->amount : null,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'processed_at' => $this->processed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'transactionable' => $this->whenLoaded('transactionable', function () {
                if (!$this->transactionable) {
                    return null;
                }
                
                // Return appropriate resource based on type
                $type = $this->transactionable_type;
                if ($type === 'App\Models\Booking') {
                    return new BookingResource($this->transactionable);
                } elseif ($type === 'App\Models\ClinicSubscription') {
                    return new \App\Http\Resources\Api\V1\Clinic\ClinicSubscriptionResource($this->transactionable);
                }
                
                return null;
            }),
            'media' => $this->whenLoaded('media', function () {
                return MediaResource::collection($this->media);
            }),
        ];
    }
}

