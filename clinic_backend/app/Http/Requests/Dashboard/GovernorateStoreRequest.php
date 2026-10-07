<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class GovernorateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('governorates.create');
    }

    public function rules(): array
    {
        return [
            'name_en' => [
                'required', 
                'string', 
                'max:255',
                'unique:governorates,name_en',
                new EnglishOnly(),
            ],
            'name_ar' => [
                'required', 
                'string', 
                'max:255',
                'unique:governorates,name_ar',
                new ArabicOnly(),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name_en.required' => __('common.name_en_required'),
            'name_en.max' => __('common.name_en_max_length', ['max' => 255]),
            'name_en.unique' => __('common.governorate_name_en_already_exists'),
            'name_en.field_must_be_english_only' => __('common.field_must_be_english_only'),
            'name_ar.required' => __('common.name_ar_required'),
            'name_ar.max' => __('common.name_ar_max_length', ['max' => 255]),
            'name_ar.unique' => __('common.governorate_name_ar_already_exists'),
            'name_ar.field_must_be_arabic_only' => __('common.field_must_be_arabic_only'),
            'is_active.required' => __('common.is_active_required'),
        ];
    }

    public function attributes(): array
    {
        return [
            'name_en' => __('common.name_en'),
            'name_ar' => __('common.name_ar'),
            'is_active' => __('common.is_active'),
        ];
    }
}

