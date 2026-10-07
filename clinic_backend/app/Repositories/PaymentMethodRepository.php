<?php

namespace App\Repositories;

use App\Contracts\PaymentMethodRepositoryInterface;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Model;

class PaymentMethodRepository extends BaseRepository implements PaymentMethodRepositoryInterface
{
    protected array $searchableFields = [
        'payment_method_en',
        'payment_method_ar',
        'payment_method_code',
    ];

    protected array $filterableFields = [
        'status',
        'is_ios_supported',
        'is_android_supported',
        'is_web_supported',
    ];
    
    public Model $model;


    /**
     * Get user payment methods
     * @param int $userId
     * @param string|null $platform Filter by platform (ios, android, web)
     */
    public function getUserPaymentMethods(int $userId, ?string $platform = null): array
    {
        // Note: PaymentMethod is a global settings table, not user-specific
        // User payment methods might be stored elsewhere (e.g., in transactions or another table)
        $query = $this->model->where('status', 'active');
        
        // Apply platform filter if provided
        if ($platform) {
            $query = $query->forPlatform($platform);
        }
        
        return $query->get()->toArray();
    }

    /**
     * Set default payment method
     */
    public function setDefault(int $paymentMethodId, int $userId): bool
    {
        // This might need to be implemented based on your actual requirements
        // since PaymentMethod is not user-specific in this model
        return true;
    }
}

