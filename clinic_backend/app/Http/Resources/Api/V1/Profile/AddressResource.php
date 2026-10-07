<?php

namespace App\Http\Resources\Api\V1\Profile;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class AddressResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'is_default' => (bool) $this->is_default,
            'type' => $this->type,
            'block' => $this->block,
            'phone' => $this->phone,
            'governorate' => $this->whenLoaded('governorate', function () {
                return [
                    'id' => $this->governorate->id,
                    'name' => $this->localized('name', $this->governorate),
                ];
            }),
            'area' => $this->whenLoaded('area', function () {
                return [
                    'id' => $this->area->id,
                    'name' => $this->localized('name', $this->area),
                ];
            }),
        ];
    }
}

