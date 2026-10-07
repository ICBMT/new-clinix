<?php

namespace App\Repositories;

use App\Contracts\WalletTransactionRepositoryInterface;
use App\Models\WalletTransaction;

class WalletTransactionRepository extends BaseRepository implements WalletTransactionRepositoryInterface
{
    protected array $searchableFields = [
        'description',
        'reference',
    ];

    protected array $filterableFields = [
        'wallet_id',
        'user_id',
        'type',
        'status',
    ];

    public function __construct(WalletTransaction $model)
    {
        parent::__construct($model);
    }
}

