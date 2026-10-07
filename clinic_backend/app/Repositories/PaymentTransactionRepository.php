<?php

namespace App\Repositories;

use App\Contracts\PaymentTransactionRepositoryInterface;
use App\Models\PaymentTransaction;

class PaymentTransactionRepository extends BaseRepository implements PaymentTransactionRepositoryInterface
{
    public function __construct(PaymentTransaction $model)
    {
        parent::__construct($model);
    }

    /**
     * Find payment transaction by invoice ID
     */
    public function findByInvoiceId(string $invoiceId): ?PaymentTransaction
    {
        return $this->model->byInvoiceId($invoiceId)->first();
    }

    /**
     * Find payment transaction by invoice ID or payment ID
     */
    public function findByInvoiceIdOrPaymentId(string $invoiceId, string $paymentId): ?PaymentTransaction
    {
        return $this->model->where(function($query) use ($invoiceId, $paymentId) {
            $query->where('invoice_id', $invoiceId)
                  ->orWhere('invoice_id', $paymentId);
        })->first();
    }

    /**
     * Delete payment transaction by invoice ID
     */
    public function deleteByInvoiceId(string $invoiceId): bool
    {
        return $this->model->where('invoice_id', $invoiceId)->delete() > 0;
    }

    /**
     * Get recent payment transactions for debugging
     */
    public function getRecentTransactions(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->select('id', 'invoice_id', 'user_id', 'booking_id', 'expires_at')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}

