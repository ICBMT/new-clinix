<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * ArabicOnly Validation Rule
 * 
 * Validates that the value contains only Arabic characters, numbers, and common punctuation.
 * Allows Arabic letters, Arabic numbers, and common punctuation marks.
 */
class ArabicOnly implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return; // Let 'required' rule handle empty values
        }

        if (!is_string($value) && !is_numeric($value)) {
            $fail(__('common.field_must_be_arabic_only', ['attribute' => $attribute]));
            return;
        }

        $value = (string) $value;
        $length = mb_strlen($value, 'UTF-8');

        // Allowed punctuation characters (including newlines for textarea fields)
        $allowedPunctuation = [' ', '.', ',', ';', ':', '!', '?', '-', '_', '(', ')', '[', ']', '{', '}', '"', "'", '«', '»', '/', '\\'];

        // Arabic Unicode ranges
        $arabicRanges = [
            [0x0600, 0x06FF],   // Arabic block
            [0x0750, 0x077F],   // Arabic Supplement
            [0x08A0, 0x08FF],   // Arabic Extended-A
            [0xFB50, 0xFDFF],   // Arabic Presentation Forms-A
            [0xFE70, 0xFEFF],   // Arabic Presentation Forms-B
        ];

        // Arabic-Indic digits ranges
        $arabicDigitRanges = [
            [0x0660, 0x0669],   // Arabic-Indic digits (٠-٩)
            [0x06F0, 0x06F9],   // Extended Arabic-Indic digits
        ];

        for ($i = 0; $i < $length; $i++) {
            $char = mb_substr($value, $i, 1, 'UTF-8');
            $code = mb_ord($char, 'UTF-8');

            // Check if it's a newline character (LF = 10, CR = 13)
            if ($code === 10 || $code === 13) {
                continue;
            }

            // Check if it's allowed punctuation
            if (in_array($char, $allowedPunctuation, true)) {
                continue;
            }

            // Check if it's an Arabic-Indic digit
            $isArabicDigit = false;
            foreach ($arabicDigitRanges as $range) {
                if ($code >= $range[0] && $code <= $range[1]) {
                    $isArabicDigit = true;
                    break;
                }
            }
            if ($isArabicDigit) {
                continue;
            }

            // Check if it's within Arabic Unicode ranges
            $isArabic = false;
            foreach ($arabicRanges as $range) {
                if ($code >= $range[0] && $code <= $range[1]) {
                    $isArabic = true;
                    break;
                }
            }

            if (!$isArabic) {
                // If we get here, the character is not Arabic or allowed punctuation
                $fail(__('common.field_must_be_arabic_only', ['attribute' => $attribute]));
                return;
            }
        }
    }
}

