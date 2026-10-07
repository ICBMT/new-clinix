<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportReasonUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('report-reasons.edit');
    }

    public function rules(): array
    {
        $reportReasonId = $this->route('id');

        return [
            'name_en' => ['required', 'string', 'max:255', new EnglishOnly()],
            'name_ar' => ['required', 'string', 'max:255', new ArabicOnly()],
            'key' => [
                'required',
                'string',
                'max:100',
                Rule::unique('report_reasons', 'key')->ignore($reportReasonId),
            ],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'requires_description' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name_en.required' => __('common.name_en_required'),
            'name_ar.required' => __('common.name_ar_required'),
            'key.required' => __('common.key_required'),
            'key.unique' => __('common.key_already_exists'),
            'is_active.required' => __('common.is_active_required'),
        ];
    }
}

