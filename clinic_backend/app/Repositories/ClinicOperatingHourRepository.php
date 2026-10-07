<?php

namespace App\Repositories;

use App\Contracts\ClinicOperatingHourRepositoryInterface;
use App\Models\ClinicOperatingHour;

class ClinicOperatingHourRepository extends BaseRepository implements ClinicOperatingHourRepositoryInterface
{
    protected array $searchableFields = [];
    protected array $filterableFields = ['clinic_id', 'day_of_week', 'is_open', 'closed_all_day'];

    protected array $relationships = ['clinic'];

    /**
     * Get operating hours by clinic
     */
    public function getOperatingHoursByClinic(int $clinicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->where('clinic_id', $clinicId)
            ->with($this->relationships)
            ->orderByRaw("FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')")
            ->get();
    }

    /**
     * Update or create operating hours for a clinic
     */
    public function updateOrCreateOperatingHours(int $clinicId, array $operatingHours): void
    {
        foreach ($operatingHours as $hour) {
            $this->model->updateOrCreate(
                [
                    'clinic_id' => $clinicId,
                    'day_of_week' => $hour['day_of_week'],
                ],
                [
                    'is_open' => $hour['is_open'] ?? true,
                    'closed_all_day' => $hour['closed_all_day'] ?? false,
                    'opening_time' => $hour['opening_time'] ?? null,
                    'closing_time' => $hour['closing_time'] ?? null,
                ]
            );
        }
    }

    /**
     * Get operating hours for a specific day
     */
    public function getOperatingHoursForDay(int $clinicId, string $dayOfWeek): ?ClinicOperatingHour
    {
        return $this->model->where('clinic_id', $clinicId)
            ->where('day_of_week', $dayOfWeek)
            ->with($this->relationships)
            ->first();
    }
}

