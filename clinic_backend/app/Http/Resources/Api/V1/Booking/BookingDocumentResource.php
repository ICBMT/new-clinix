<?php

namespace App\Http\Resources\Api\V1\Booking;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class BookingDocumentResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'name' => $this->name,
            'file_path' => $this->file_path ? asset('storage/' . $this->file_path) : null,
            'file_name' => $this->file_name,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

