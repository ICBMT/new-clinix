<?php

namespace App\Repositories;

use App\Contracts\BookingDocumentRepositoryInterface;
use App\Models\BookingDocument;

class BookingDocumentRepository extends BaseRepository implements BookingDocumentRepositoryInterface
{
    protected array $searchableFields = ['name', 'file_name'];
    protected array $filterableFields = ['booking_id', 'file_type'];

    protected array $relationships = ['booking'];

    /**
     * Get documents by booking
     */
    public function getDocumentsByBooking(int $bookingId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->where('booking_id', $bookingId)
            ->with($this->relationships)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}

