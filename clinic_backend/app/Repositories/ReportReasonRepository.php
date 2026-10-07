<?php

namespace App\Repositories;

use App\Contracts\ReportReasonRepositoryInterface;
use App\Models\ReportReason;

class ReportReasonRepository extends BaseRepository implements ReportReasonRepositoryInterface
{
    protected array $searchableFields = ['name_en', 'name_ar', 'key'];
    protected array $filterableFields = ['is_active'];

    /**
     * Get active report reasons
     */
    public function getActiveReportReasons(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->active()
            ->orderBy('sort_order', 'asc')
            ->get();
    }
}

