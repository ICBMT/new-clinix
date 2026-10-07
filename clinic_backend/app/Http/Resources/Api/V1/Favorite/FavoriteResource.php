<?php

namespace App\Http\Resources\Api\V1\Favorite;

use App\Http\Resources\BaseResource;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Http\Resources\Api\V1\Treatment\TreatmentResource;
use Illuminate\Http\Request;

class FavoriteResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'favoritable_type' => $this->favoritable_type,
            'favoritable_id' => $this->favoritable_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'favoritable' => $this->whenLoaded('favoritable', function () {
                if (!$this->favoritable) {
                    return null;
                }
                
                // Return appropriate resource based on type
                $type = $this->favoritable_type;
                if ($type === 'App\Models\Clinic') {
                    return new \App\Http\Resources\Api\V1\Clinic\ClinicResource($this->favoritable);
                } elseif ($type === 'App\Models\Treatment') {
                    return new TreatmentResource($this->favoritable);
                } elseif ($type === 'App\Models\Machine') {
                    return new \App\Http\Resources\Api\V1\Machine\MachineResource($this->favoritable);
                }
                
                return null;
            }),
        ];
    }
}

