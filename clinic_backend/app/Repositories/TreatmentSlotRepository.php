<?php

namespace App\Repositories;

use App\Contracts\TreatmentSlotRepositoryInterface;
use App\Models\TreatmentSlot;

class TreatmentSlotRepository extends BaseRepository implements TreatmentSlotRepositoryInterface
{
    protected array $searchableFields = [
        'notes_en',
        'notes_ar',
    ];

    protected array $filterableFields = [
        'treatment_id',
        'slot_date',
        'status',
        'price',
    ];

    protected array $relationships = [
        'treatment:id,name_en,name_ar',
    ];

    public function __construct(TreatmentSlot $model)
    {
        parent::__construct($model);
    }

    /**
     * Override paginate to ensure proper ordering and relationship loading
     */
    public function paginate(\Illuminate\Http\Request $request, int $perPage = 15, array $columns = ['*']): \Illuminate\Pagination\LengthAwarePaginator
    {
        // Get paginated results
        $results = parent::paginate($request, $perPage, $columns);
        
        // Ensure treatment is loaded for all items (in case it wasn't loaded)
        $results->getCollection()->loadMissing('treatment:id,name_en,name_ar');
        
        return $results;
    }

    /**
     * Override applySorting to default to slot_date and start_time for better UX
     */
    protected function applySorting(\Illuminate\Database\Eloquent\Builder $query, \Illuminate\Http\Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $sortBy = $request->get('sort_by');
        $sortOrder = $request->get('sort_order', 'asc');

        // If no sort_by is specified, default to slot_date and start_time
        if (!$sortBy) {
            return $query->orderBy('slot_date', 'asc')
                        ->orderBy('start_time', 'asc')
                        ->orderBy('created_at', 'desc');
        }

        // Otherwise use parent sorting logic
        return parent::applySorting($query, $request);
    }

    /**
     * Get available slots for a treatment
     */
    public function getAvailableSlots(int $treatmentId, ?string $date = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = $this->model
            ->where('treatment_id', $treatmentId)
            ->where('status', 'available');

        if ($date) {
            $query->whereDate('slot_date', $date);
        }

        return $query->orderBy('slot_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Get slots by date range
     */
    public function getSlotsByDateRange(int $treatmentId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('treatment_id', $treatmentId)
            ->whereBetween('slot_date', [$startDate, $endDate])
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->get();
    }
}

