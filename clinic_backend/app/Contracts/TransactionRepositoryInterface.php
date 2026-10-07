<?php

namespace App\Contracts;

interface TransactionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get transactions by type
     */
    public function getTransactionsByType(string $type): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get transactions by status
     */
    public function getTransactionsByStatus(string $status): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get transactions for a user
     * Returns transactions where transactionable is a Booking belonging to the user OR where transactionable is the User itself
     */
    public function getTransactionsForUser(int $userId, array $bookingIds = []): \Illuminate\Database\Eloquent\Collection;

    /**
     * Get booking IDs for a user
     */
    public function getBookingIdsForUser(int $userId): array;
}

