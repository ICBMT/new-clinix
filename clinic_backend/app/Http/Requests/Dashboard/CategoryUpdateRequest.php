<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class CategoryUpdateRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     * Ensure empty or placeholder parent_id values are treated as null.
     */
    protected function prepareForValidation(): void
    {
        $parentId = $this->input('parent_id');

        if ($parentId === '' || $parentId === 'none') {
            $this->merge([
                'parent_id' => null,
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('categories.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $categoryId = $this->route('category');
        
        // Check if name fields are present in request
        $hasNameEn = $this->has('name_en');
        $hasNameAr = $this->has('name_ar');
        $hasStatus = $this->has('status');
        
        return [
            'name_en' => [($hasNameEn ? 'required' : 'nullable'), 'string', 'max:50', 'unique:categories,name_en,' . $categoryId, new EnglishOnly()],
            'name_ar' => [($hasNameAr ? 'required' : 'nullable'), 'string', 'max:50', 'unique:categories,name_ar,' . $categoryId, new ArabicOnly()],
            'description_en' => ['nullable', 'string', 'max:1000', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', 'max:1000', new ArabicOnly()],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'status' => [($hasStatus ? 'required' : 'nullable'), 'in:active,inactive'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
        ];
    }
    
    public function messages(): array
    {
        return [
            'name_en.required' => __('common.name_en_required'),
            'name_en.unique' => __('common.category_name_already_exists'),
            'name_en.max' => __('common.category_name_max_length'),
            'name_ar.required' => __('common.name_ar_required'),
            'name_ar.unique' => __('common.category_name_already_exists'),
            'name_ar.max' => __('common.category_name_max_length'),
            'parent_id.integer' => __('common.parent_category_invalid'),
            'parent_id.exists' => __('common.parent_category_invalid'),
            'status.required' => __('common.status_required'),
            'status.in' => __('common.status_invalid'),
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name_en' => __('common.name_en'),
            'name_ar' => __('common.name_ar'),
            'description_en' => __('common.description_en'),
            'description_ar' => __('common.description_ar'),
            'parent_id' => __('common.parent_category'),
            'status' => __('common.status'),
            'sort_order' => __('common.sort_order'),
        ];
    }
}

