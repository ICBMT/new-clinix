<?php

namespace App\Repositories;

use App\Contracts\TransactionRepositoryInterface;
use App\Models\Transaction;

class TransactionRepository extends BaseRepository implements TransactionRepositoryInterface
{
    protected array $searchableFields = [
        'transaction_id',
        'gateway_transaction_id',
        'failure_reason',
    ];

    protected array $filterableFields = [
        'type',
        'status',
        'payment_method',
        'payment_gateway',
    ];

    public function __construct(Transaction $model)
    {
        parent::__construct($model);
    }

    /**
     * Get transactions by type
     */
    public function getTransactionsByType(string $type): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('type', $type)
            ->with('transactionable')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get transactions by status
     */
    public function getTransactionsByStatus(string $status): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('status', $status)
            ->with('transactionable')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get transactions for a user
     * Returns transactions where transactionable is a Booking belonging to the user OR where transactionable is the User itself
     */
    public function getTransactionsForUser(int $userId, array $bookingIds = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = $this->model->newQuery();

        $query->where(function($q) use ($userId, $bookingIds) {
            // Transactions where transactionable is a Booking belonging to the user
            if (!empty($bookingIds)) {
                $q->where(function($subQ) use ($bookingIds) {
                    $subQ->where('transactionable_type', \App\Models\Booking::class)
                          ->whereIn('transactionable_id', $bookingIds);
                });
            }
            
            // Or transactions where transactionable is the User itself
            $q->orWhere(function($subQ) use ($userId) {
                $subQ->where('transactionable_type', \App\Models\User::class)
                      ->where('transactionable_id', $userId);
            });
        });

        return $query->with('transactionable')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get booking IDs for a user
     * Note: This method uses BookingRepository through dependency injection would be better, but for now we'll use direct query
     * TODO: Refactor to use BookingRepositoryInterface
     */
    public function getBookingIdsForUser(int $userId): array
    {
        return \App\Models\Booking::where('user_id', $userId)->pluck('id')->toArray();
    }
}

