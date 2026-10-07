<?php

namespace App\Repositories;

use App\Contracts\PaymentRepositoryInterface;
use App\Models\PaymentMethod;
use Illuminate\Pagination\LengthAwarePaginator;

class PaymentRepository extends BaseRepository implements PaymentRepositoryInterface
{
    protected array $searchableFields = ['transaction_id', 'description'];
    protected array $filterableFields = ['user_id', 'status', 'type'];

    public function getUserPaymentMethods(int $userId, ?string $platform = null): array
    {
        // Payment methods are global; return active methods
        $query = PaymentMethod::where('status', 'active');
        
        // Apply platform filter if provided
        if ($platform) {
            $query = $query->forPlatform($platform);
        }
        
        return $query->orderBy('payment_method_en')
            ->get()
            ->all();
    }

    public function getUserPayments(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return \App\Models\Transaction::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function executePayment(array $data, int $userId): array
    {
        return [];
    }

    public function refundPayment(string $transactionId, array $data, int $userId): array
    {
        return [];
    }
}

