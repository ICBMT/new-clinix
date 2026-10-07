<?php

namespace App\Http\Resources\Api\V1\Broadcast;

use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class BroadcastResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->localized('title'),
            'description' => $this->localized('description'),
            'recipients' => $this->recipients ?? [],
            'target_roles' => $this->target_roles ?? [],
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'sent_by' => $this->sent_by,
            'status' => $this->status ?? 'draft',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'sender' => $this->whenLoaded('sender', function () {
                return [
                    'id' => $this->sender->id,
                    'name' => $this->sender->name,
                ];
            }),
        ];
    }
}

