<?php

namespace App\Http\Resources\Api\V1\Notification;

use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class NotificationResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->localized('title'),
            'message' => $this->localized('description'),
            'description' => $this->localized('description'),
            'recipient_type' => $this->recipient_type,
            'recipient_id' => $this->recipient_id,
            'is_read' => $this->is_read ?? false,
            'type' => $this->type ?? 'info',
            'audience' => $this->audience ?? 'users',
            'delivery_method' => $this->delivery_method ?? 'push',
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'status' => $this->status ?? 'unread',
            'image_url' => $this->image_url ? asset('storage/' . $this->image_url) : null,
            'notifiable_id' => $this->notifiable_id,
            'notifiable_type' => $this->notifiable_type,
            'data' => $this->data ?? [],
            'broadcast_id' => $this->broadcast_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'recipient' => $this->whenLoaded('recipient', function () {
                return [
                    'id' => $this->recipient->id,
                    'name' => $this->recipient->name,
                ];
            }),
            'broadcast' => $this->whenLoaded('broadcast', function () {
                return [
                    'id' => $this->broadcast->id,
                    'title' => $this->localized('title', null, $this->broadcast),
                ];
            }),
        ];
    }
}
