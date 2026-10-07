<?php

namespace App\Http\Resources\Api\V1\Booking;

use App\Http\Resources\BaseResource;

class BookingReasonResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type instanceof \UnitEnum ? $this->type->value : $this->type,
            'title' => $this->localized('title'),
            'description' => $this->localized('description'),
            'sort_order' => $this->sort_order,
            'is_active' => (bool) $this->is_active,
        ];
    }
}


