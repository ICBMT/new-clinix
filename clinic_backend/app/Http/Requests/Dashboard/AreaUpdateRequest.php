<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class AreaUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('areas.edit');
    }

    public function rules(): array
    {
        $areaId = $this->route('id');
        
        return [
            'governorate_id' => ['required', 'integer', 'exists:governorates,id'],
            'name_en' => ['required', 'string', 'max:255', new \App\Rules\EnglishOnly()],
            'name_ar' => ['required', 'string', 'max:255', new \App\Rules\ArabicOnly()],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $areaId = $this->route('id');
            $governorateId = $this->input('governorate_id');
            $nameEn = $this->input('name_en');
            $nameAr = $this->input('name_ar');

            if ($governorateId && $nameEn && $nameAr) {
                // Check if area with same name_en AND name_ar exists in the same governorate (excluding current area)
                $exists = \App\Models\Area::where('governorate_id', $governorateId)
                    ->where('id', '!=', $areaId)
                    ->where('name_en', $nameEn)
                    ->where('name_ar', $nameAr)
                    ->exists();

                if ($exists) {
                    $validator->errors()->add('name_en', __('common.area_already_exists'));
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'governorate_id.required' => __('common.governorate_required'),
            'governorate_id.exists' => __('common.governorate_not_found'),
            'name_en.required' => __('common.name_en_required'),
            'name_en.max' => __('common.name_en_max_length', ['max' => 255]),
            'name_en.english_only' => __('common.name_en_english_only'),
            'name_ar.required' => __('common.name_ar_required'),
            'name_ar.max' => __('common.name_ar_max_length', ['max' => 255]),
            'name_ar.arabic_only' => __('common.name_ar_arabic_only'),
            'is_active.required' => __('common.is_active_required'),
        ];
    }

    public function attributes(): array
    {
        return [
            'governorate_id' => __('common.governorate'),
            'name_en' => __('common.name_en'),
            'name_ar' => __('common.name_ar'),
            'is_active' => __('common.is_active'),
        ];
    }
}

