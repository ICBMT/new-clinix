<?php

namespace App\Http\Resources\Api\V1\Wallet;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Format similar to TransactionResource for consistency
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_id' => $this->reference ?? 'WT-' . $this->id,
            'wallet_id' => $this->wallet_id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'amount' => $this->amount ? (float) $this->amount : null,
            'currency' => $this->currency ?? 'KWD',
            'payment_method' => $this->type === 'topup' ? 'myfatoorah' : 'wallet',
            'status' => $this->status,
            'description' => $this->description,
            'reference' => $this->reference,
            'balance_before' => $this->balance_before ? (float) $this->balance_before : null,
            'balance_after' => $this->balance_after ? (float) $this->balance_after : null,
            'processed_at' => $this->created_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
