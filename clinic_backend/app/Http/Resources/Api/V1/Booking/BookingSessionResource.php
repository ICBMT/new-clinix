<?php

namespace App\Http\Resources\Api\V1\Booking;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentSlotResource;
use Illuminate\Http\Request;

class BookingSessionResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'treatment_slot_id' => $this->treatment_slot_id,
            'slot_date' => $this->slot_date?->toDateString(),
            'slot_time' => $this->slot_time?->format('H:i'),
            'status' => $this->status ?? 'pending',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'treatment_slot' => $this->whenLoaded('treatmentSlot', function () {
                return new TreatmentSlotResource($this->treatmentSlot);
            }),
        ];
    }
}

