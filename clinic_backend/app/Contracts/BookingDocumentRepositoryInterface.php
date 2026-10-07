<?php

namespace App\Contracts;

interface BookingDocumentRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get documents by booking
     */
    public function getDocumentsByBooking(int $bookingId): \Illuminate\Database\Eloquent\Collection;
}

