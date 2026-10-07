<?php

namespace App\Http\Resources\Api\V1\Profile;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class PaymentMethodResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_method_id' => $this->payment_method_id,
            'payment_method_en' => $this->payment_method_en,
            'payment_method_ar' => $this->payment_method_ar,
            'payment_method_code' => $this->payment_method_code,
            'is_direct_payment' => $this->is_direct_payment,
            'service_charge' => $this->service_charge ? (float) $this->service_charge : null,
            'total_amount' => $this->total_amount ? (float) $this->total_amount : null,
            'currency_iso' => $this->currency_iso,
            'payment_currency_iso' => $this->payment_currency_iso,
            'image_url' => $this->image_url ? $this->image_url : null,
            'is_embedded_supported' => $this->is_embedded_supported ?? false,
            'is_ios_supported' => $this->is_ios_supported ?? true,
            'is_android_supported' => $this->is_android_supported ?? true,
            'is_web_supported' => $this->is_web_supported ?? true,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
