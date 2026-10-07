<?php

namespace App\Http\Resources\Api\V1\HelpCenter;

use App\Http\Resources\BaseResource;
use Illuminate\Http\Request;

class FAQResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->localized('question'),
            'answer' => $this->localized('answer'),
            'category' => $this->category,
            'is_active' => $this->is_active ?? true,
            'sort_order' => $this->sort_order ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

