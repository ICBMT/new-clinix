<?php

namespace App\Http\Resources\Api\V1\Clinic;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class ClinicOperatingHourResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'clinic_id' => $this->clinic_id,
            'day_of_week' => $this->day_of_week,
            'is_open' => $this->is_open,
            'closed_all_day' => $this->closed_all_day,
            'opening_time' => $this->opening_time?->format('H:i'),
            'closing_time' => $this->closing_time?->format('H:i'),
        ];
    }
}

