<?php

namespace App\Repositories;

use App\Contracts\BookingReasonRepositoryInterface;
use App\Enums\BookingReasonType;
use App\Models\BookingReason;
use Illuminate\Support\Collection;

class BookingReasonRepository extends BaseRepository implements BookingReasonRepositoryInterface
{
    protected array $searchableFields = ['title_en', 'title_ar', 'description_en', 'description_ar'];
    protected array $filterableFields = ['type', 'is_active'];

    public function __construct(BookingReason $model)
    {
        parent::__construct($model);
    }

    public function getReasonsByType(BookingReasonType|string $type): Collection
    {
        return $this->model
            ->active()
            ->ofType($type)
            ->ordered()
            ->get();
    }
}


