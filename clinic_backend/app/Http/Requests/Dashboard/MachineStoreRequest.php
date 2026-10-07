<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;

class MachineStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('machines.create');
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // For clinic role, ensure clinic_id is not empty
        $user = $this->user();
        if ($user && $user->hasRole('clinic') && !$user->hasRole('super-admin')) {
            // Clinic role cannot create global machines
            if ($this->has('clinic_id') && $this->input('clinic_id') === '') {
                $this->merge(['clinic_id' => null]);
            }
        } else {
            // Super admin can create global machines (clinic_id can be null)
            if ($this->has('clinic_id') && $this->input('clinic_id') === '') {
                $this->merge(['clinic_id' => null]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isClinicRole = $user && $user->hasRole('clinic') && !$user->hasRole('super-admin');
        
        return [
            'clinic_id' => $isClinicRole 
                ? ['required', 'integer', 'exists:clinics,id'] 
                : ['nullable', 'integer', 'exists:clinics,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'], // Keep for backward compatibility
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'model_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'model_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'serial_number' => ['required', 'string', 'max:255', 'unique:machines,serial_number'],
            'manufacturer_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'manufacturer_ar' => ['nullable', 'string', 'max:255', new ArabicOnly()],
            'description_en' => ['nullable', 'string', 'max:2000', new EnglishOnly()],
            'description_ar' => ['nullable', 'string', 'max:2000', new ArabicOnly()],
            'status' => ['required', 'string', 'in:ready,maintenance,busy'],
            'request_status' => ['nullable', 'string', 'in:pending,approved,rejected'],
            'image' => ['nullable', 'image', 'max:2048'],
        ];
    }
    
    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'clinic_id.exists' => __('common.clinic_not_found'),
            'category_id.exists' => __('common.category_not_found'),
            'model_en.required' => __('common.model_en') . ' ' . __('common.is_required'),
            'model_en.max' => __('common.field_must_not_exceed_characters', ['max' => 255]),
            'model_en.field_must_be_english_only' => __('common.field_must_be_english_only'),
            'model_ar.required' => __('common.model_ar') . ' ' . __('common.is_required'),
            'model_ar.max' => __('common.field_must_not_exceed_characters', ['max' => 255]),
            'model_ar.field_must_be_arabic_only' => __('common.field_must_be_arabic_only'),
            'serial_number.required' => __('common.serial_number_required'),
            'serial_number.unique' => __('common.serial_number_already_exists'),
            'manufacturer_en.max' => __('common.field_must_not_exceed_characters', ['max' => 255]),
            'manufacturer_en.field_must_be_english_only' => __('common.field_must_be_english_only'),
            'manufacturer_ar.max' => __('common.field_must_not_exceed_characters', ['max' => 255]),
            'manufacturer_ar.field_must_be_arabic_only' => __('common.field_must_be_arabic_only'),
            'description_en.max' => __('common.description_en_max_length', ['max' => 2000]),
            'description_en.field_must_be_english_only' => __('common.description_en_must_be_english'),
            'description_ar.max' => __('common.description_ar_max_length', ['max' => 2000]),
            'description_ar.field_must_be_arabic_only' => __('common.description_ar_must_be_arabic'),
            'status.required' => __('common.status_required'),
            'status.in' => __('common.status_invalid'),
            'request_status.in' => __('common.status_invalid'),
            'image.image' => __('common.image_must_be_image'),
            'image.max' => __('common.image_size_exceeded'),
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'clinic_id' => __('common.clinic'),
            'category_id' => __('common.category'),
            'model_en' => __('common.model_en'),
            'model_ar' => __('common.model_ar'),
            'serial_number' => __('common.serial_number'),
            'manufacturer_en' => __('common.manufacturer_en'),
            'manufacturer_ar' => __('common.manufacturer_ar'),
            'description_en' => __('common.description_en'),
            'description_ar' => __('common.description_ar'),
            'status' => __('common.status'),
            'request_status' => __('common.request_status'),
            'image' => __('common.image'),
        ];
    }
}

