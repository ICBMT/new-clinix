<?php

namespace App\Http\Resources\Api\V1\Area;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class AreaResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->localized('name'),
            'description' => $this->localized('description'),
            'governorate_id' => $this->governorate_id,
            'status' => $this->status,
            'governorate' => $this->whenLoaded('governorate', function () {
                return [
                    'id' => $this->governorate->id,
                    'name' => $this->localized('name', $this->governorate),
                ];
            }),
        ];
    }
}

