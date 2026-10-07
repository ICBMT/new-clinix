<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class BannerStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('banners.create');
    }

    protected function prepareForValidation(): void
    {
        // Trim title fields - keep empty string if trimmed value is empty (so 'required' rule can catch it)
        if ($this->has('title_en')) {
            $this->merge(['title_en' => trim($this->title_en ?? '')]);
        }
        if ($this->has('title_ar')) {
            $this->merge(['title_ar' => trim($this->title_ar ?? '')]);
        }
        
        // Set default type to 'homepage' if not provided (hidden from form but can be customized in future)
        if (!$this->has('type') || empty($this->type)) {
            $this->merge(['type' => 'homepage']);
        }
        
        // Set default position to 'top' if not provided or invalid
        if (!$this->has('position') || empty($this->position) || !in_array($this->position, ['top', 'middle', 'bottom', 'sidebar'])) {
            $this->merge(['position' => 'top']);
        }
        
        // Convert empty strings to null for category_id and service_id
        if ($this->has('category_id') && $this->category_id === '') {
            $this->merge(['category_id' => null]);
        }
        if ($this->has('service_id') && $this->service_id === '') {
            $this->merge(['service_id' => null]);
        }
        
        // Remove mobile_image_url if not provided (to avoid inserting null/empty)
        if ($this->has('mobile_image_url') && (empty($this->mobile_image_url) || $this->mobile_image_url === '')) {
            $this->request->remove('mobile_image_url');
        }
    }

    public function rules(): array
    {
        return [
            'title_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'title_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'description_en' => ['nullable', 'string', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', new ArabicOnly()],
            'image_url' => ['nullable', 'string', 'max:500'],
            'mobile_image_url' => ['nullable', 'string', 'max:500'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'type' => ['nullable', 'string', 'max:50'],
            'category_id' => ['nullable', 'sometimes', 'integer', 'exists:categories,id'],
            'service_id' => ['nullable', 'sometimes', 'integer', 'exists:treatments,id'],
            'linkable_type' => ['nullable', 'string'],
            'linkable_id' => ['nullable', 'integer'],
            'position' => ['nullable', 'string', 'in:top,middle,bottom,sidebar'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', 'in:active,inactive'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'mobile_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'title_en.required' => __('common.title_en_required'),
            'title_ar.required' => __('common.title_ar_required'),
            'title_en.max' => __('common.title_en_max', ['max' => 255]),
            'title_ar.max' => __('common.title_ar_max', ['max' => 255]),
            'link_url.url' => __('common.link_url_invalid'),
            'link_url.max' => __('common.link_url_max', ['max' => 500]),
            'category_id.exists' => __('common.category_not_found'),
            'service_id.exists' => __('common.treatment_not_found'),
            'status.required' => __('common.status_required'),
            'status.in' => __('common.status_invalid'),
            'end_date.after_or_equal' => __('common.end_date_must_be_after_start_date'),
            'image.file' => __('common.image_must_be_file'),
            'image.mimes' => __('common.image_must_be_image'),
            'image.max' => __('common.image_max_size', ['max' => '2MB']),
            'mobile_image.file' => __('common.image_must_be_file'),
            'mobile_image.mimes' => __('common.image_must_be_image'),
            'mobile_image.max' => __('common.image_max_size', ['max' => '2MB']),
        ];
    }
}

