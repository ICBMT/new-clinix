<?php

namespace App\Contracts;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface BookingRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get user bookings
     */
    public function getUserBookings(int $userId, ?string $status = null, int $perPage = 15, ?bool $isReviewed = null, ?string $startDate = null, ?string $endDate = null): LengthAwarePaginator;

    /**
     * Get unreviewed bookings for a user and clinic
     */
    public function getUnreviewedBookingsForClinic(int $userId, int $clinicId, int $limit = 10): \Illuminate\Support\Collection;

    /**
     * Create booking
     */
    public function createBooking(array $data): \App\Models\Booking;

    /**
     * Create booking add-on
     */
    public function createBookingAddOn(array $data): \App\Models\BookingAddOn;

    /**
     * Find booking with relations
     */
    public function findWithRelations(int $id, array $relations = []): \App\Models\Booking;

    /**
     * Cancel booking
     */
    public function cancel(int $bookingId, ?string $reason = null): \App\Models\Booking;

    /**
     * Reschedule booking
     */
    public function reschedule(int $bookingId, string $bookingDate, string $bookingTime): \App\Models\Booking;

    /**
     * Update booking status
     */
    public function updateStatus(int $bookingId, string $status): \App\Models\Booking;

    /**
     * Confirm booking
     */
    public function confirm(int $bookingId): \App\Models\Booking;

    /**
     * Complete booking
     */
    public function complete(int $bookingId): \App\Models\Booking;

    /**
     * Mark booking as no-show
     */
    public function noShow(int $bookingId): \App\Models\Booking;

    /**
     * Get bookings accessible to a user based on their role
     * 
     * - Super admin sees all bookings
     * - Clinic owner sees bookings from all their owned clinics
     * - Clinic manager sees bookings from their assigned clinics
     * - Other roles with permissions see all bookings (like super admin)
     */
    public function getBookingsForUser(\App\Models\User $user, ?array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get booking IDs for a user
     */
    public function getBookingIdsForUser(int $userId): array;

    /**
     * Get paid bookings without transactions for a user
     */
    public function getPaidBookingsWithoutTransactions(int $userId, array $transactionableIds = []): \Illuminate\Database\Eloquent\Collection;
}
