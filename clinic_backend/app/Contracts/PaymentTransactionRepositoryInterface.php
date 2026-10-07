<?php

namespace App\Contracts;

interface PaymentTransactionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find payment transaction by invoice ID
     */
    public function findByInvoiceId(string $invoiceId): ?\App\Models\PaymentTransaction;

    /**
     * Find payment transaction by invoice ID or payment ID
     */
    public function findByInvoiceIdOrPaymentId(string $invoiceId, string $paymentId): ?\App\Models\PaymentTransaction;

    /**
     * Delete payment transaction by invoice ID
     */
    public function deleteByInvoiceId(string $invoiceId): bool;

    /**
     * Get recent payment transactions for debugging
     */
    public function getRecentTransactions(int $limit = 10): \Illuminate\Database\Eloquent\Collection;
}

