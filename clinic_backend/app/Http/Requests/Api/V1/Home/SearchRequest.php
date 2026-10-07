<?php

namespace App\Http\Requests\Api\V1\Home;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'in:treatments,clinics,machines'],
            'search' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,id'],
            'treatment_ids' => ['nullable', 'array'],
            'treatment_ids.*' => ['integer', 'exists:treatments,id'],
            'machine_ids' => ['nullable', 'array'],
            'machine_ids.*' => ['integer', 'exists:machines,id'],
            'experience' => ['nullable', 'string'],
            'sort_by' => ['nullable', 'string', 'in:newest,popularity,price_asc,price_desc,rating,highest_price,lowest_price,most_popular,best_selling'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'location' => ['nullable', 'string', 'max:255'],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'governorate_id' => ['nullable', 'integer', 'exists:governorates,id'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius' => ['nullable', 'numeric', 'min:1', 'max:100'],
            'rating' => ['nullable', 'array'],
            'rating.*' => ['integer', 'min:1', 'max:5'],
            'star_rating' => ['nullable', 'array'],
            'star_rating.*' => ['integer', 'min:1', 'max:5'],
            'top_doctor' => ['nullable', 'boolean'],
            'is_discounted' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'search.max' => __('common.search_query_max'),
            'category_id.exists' => __('common.category_not_found'),
            'sort_by.in' => __('common.invalid_sort_option'),
            'min_price.numeric' => __('common.price_must_be_numeric'),
            'min_price.min' => __('common.price_min_zero'),
            'max_price.numeric' => __('common.price_must_be_numeric'),
            'max_price.min' => __('common.price_min_zero'),
            'max_price.gte' => __('common.max_price_gte_min_price'),
            'latitude.numeric' => __('common.latitude_numeric'),
            'longitude.numeric' => __('common.longitude_numeric'),
            'radius.numeric' => __('common.radius_numeric'),
            'radius.min' => __('common.radius_min'),
            'radius.max' => __('common.radius_max'),
            'rating.array' => __('common.rating_must_be_array'),
            'rating.*.integer' => __('common.rating_value_must_be_integer'),
            'rating.*.min' => __('common.rating_min'),
            'rating.*.max' => __('common.rating_max'),
            'star_rating.array' => __('common.star_rating_must_be_array'),
            'star_rating.*.integer' => __('common.star_rating_value_must_be_integer'),
            'star_rating.*.min' => __('common.rating_min'),
            'star_rating.*.max' => __('common.rating_max'),
        ];
    }
}


