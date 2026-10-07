<?php

namespace App\Contracts;

use App\Enums\BookingReasonType;
use Illuminate\Support\Collection;

interface BookingReasonRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get active booking reasons filtered by type.
     */
    public function getReasonsByType(BookingReasonType|string $type): Collection;
}


