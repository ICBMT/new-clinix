<?php

namespace App\Http\Resources\Api\V1\Treatment;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class TreatmentSlotResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'treatment_id' => $this->treatment_id,
            'slot_date' => $this->slot_date?->toDateString(),
            'start_time' => $this->start_time?->format('H:i'),
            'end_time' => $this->end_time?->format('H:i'),
            'buffer_time_minutes' => $this->buffer_time_minutes,
            'max_bookings_per_slot' => $this->max_bookings_per_slot,
            'slot_duration' => $this->slot_duration,
            'status' => $this->status,
            'price' => $this->price ? (float) $this->price : null,
            'notes' => $this->localized('notes'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

