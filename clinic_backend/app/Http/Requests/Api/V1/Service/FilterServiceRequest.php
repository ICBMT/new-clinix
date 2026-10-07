<?php

namespace App\Http\Requests\Api\V1\Service;

use Illuminate\Foundation\Http\FormRequest;

class FilterServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'sort_by' => ['nullable', 'string', 'in:popularity,price_asc,price_desc,newest,rating'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'location' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'min_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_ids.array' => __('common.validation_category_ids_array'),
            'category_ids.*.exists' => __('common.validation_category_exists'),
            'sort_by.in' => __('common.validation_sort_by_invalid'),
            'min_price.numeric' => __('common.validation_min_price_numeric'),
            'max_price.numeric' => __('common.validation_max_price_numeric'),
            'max_price.gte' => __('common.validation_max_price_gte_min'),
            'min_rating.min' => __('common.validation_min_rating_min'),
            'min_rating.max' => __('common.validation_min_rating_max'),
        ];
    }
}

