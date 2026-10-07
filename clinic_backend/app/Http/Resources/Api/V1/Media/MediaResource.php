<?php

namespace App\Http\Resources\Api\V1\Media;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class MediaResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        // Ensure file_url is a full URL with domain
        $fileUrl = $this->file_name;
        if ($fileUrl && !str_starts_with($fileUrl, 'http')) {
            $fileUrl = url($fileUrl);
        }

        return [
            'id' => $this->id,
            'file_url' => $fileUrl,    
            'file_type' => $this->file_type,
            'mediable_type' => $this->mediable_type,
            'mediable_id' => $this->mediable_id,
            'collection_name' => $this->collection_name,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}

