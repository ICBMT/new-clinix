<?php

namespace App\Http\Resources\Api\V1\DeviceToken;

use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class DeviceTokenResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'token' => $this->token,
            'type' => $this->type,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'user' => $this->user ? new UserResource($this->user) : null,
        ];
    }
}

