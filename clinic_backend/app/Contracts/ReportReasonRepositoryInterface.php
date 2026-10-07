<?php

namespace App\Contracts;

interface ReportReasonRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active report reasons
     */
    public function getActiveReportReasons(): \Illuminate\Database\Eloquent\Collection;
}

