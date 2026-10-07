<?php

namespace App\Http\Requests\Api\V1\Review;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'treatment_id' => ['required', 'integer', 'exists:treatments,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
            'would_recommend' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'booking_id.required' => __('common.booking_id_required'),
            'booking_id.integer' => __('common.booking_id_invalid'),
            'booking_id.exists' => __('common.booking_not_found'),
            'treatment_id.required' => __('common.treatment_id_required'),
            'treatment_id.integer' => __('common.treatment_id_invalid'),
            'treatment_id.exists' => __('common.treatment_not_found'),
            'rating.required' => __('common.rating_required'),
            'rating.integer' => __('common.rating_invalid'),
            'rating.min' => __('common.rating_min', ['min' => 1]),
            'rating.max' => __('common.rating_max', ['max' => 5]),
            'comment.string' => __('common.comment_invalid'),
            'comment.max' => __('common.comment_max_length', ['max' => 1000]),
            'clinic_id.required' => __('common.clinic_id_required'),
            'clinic_id.integer' => __('common.clinic_id_invalid'),
            'clinic_id.exists' => __('common.clinic_not_found'),
            'would_recommend.boolean' => __('common.would_recommend_invalid'),
        ];
    }
}

