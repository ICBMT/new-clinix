<?php

namespace App\Http\Resources\Api\V1\Governorate;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Area\AreaResource;
use Illuminate\Http\Request;

class GovernorateResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->localized('name'),
            'description' => $this->localized('description'),
            'status' => $this->status,
            'areas' => $this->whenLoaded('areas', function () {
                return AreaResource::collection($this->areas);
            }),
        ];
    }
}

