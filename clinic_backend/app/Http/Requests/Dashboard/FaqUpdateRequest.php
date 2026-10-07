<?php

namespace App\Http\Requests\Dashboard;

use App\Rules\ArabicOnly;
use App\Rules\EnglishOnly;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FaqUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('faqs.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Get FAQ ID from route parameter (route uses 'id' as parameter name)
        $faqId = $this->route('id');
        $faqIdValue = is_object($faqId) ? $faqId->id : $faqId;

        return [
            'question_en' => ['required', 'string', 'max:500', Rule::unique('faqs', 'question_en')->ignore($faqIdValue), new EnglishOnly()],
            'question_ar' => ['required', 'string', 'max:500', new ArabicOnly()],
            'answer_en' => ['required', 'string', 'max:5000', new EnglishOnly()],
            'answer_ar' => ['required', 'string', 'max:5000', new ArabicOnly()],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'question_en.required' => __('common.question_en_required'),
            'question_en.unique' => __('common.question_already_exists'),
            'question_en.max' => __('common.question_too_long'),
            'question_en.english_only' => __('common.field_must_be_english_only'),
            'question_ar.required' => __('common.question_ar_required'),
            'question_ar.arabic_only' => __('common.field_must_be_arabic_only'),
            'answer_en.required' => __('common.answer_en_required'),
            'answer_en.max' => __('common.answer_too_long'),
            'answer_en.english_only' => __('common.field_must_be_english_only'),
            'answer_ar.required' => __('common.answer_ar_required'),
            'answer_ar.arabic_only' => __('common.field_must_be_arabic_only'),
        ];
    }
}
