<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * EnglishOnly Validation Rule
 * 
 * Validates that the value contains only English characters, numbers, and common punctuation.
 * Does not allow Arabic or other non-ASCII characters.
 */
class EnglishOnly implements ValidationRule
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
            $fail(__('common.field_must_be_english_only', ['attribute' => $attribute]));
            return;
        }

        $value = (string) $value;
        $length = mb_strlen($value, 'UTF-8');

        // Allowed punctuation characters (including newlines for textarea fields)
        $allowedPunctuation = [' ', '-', '_', '.', ',', ';', ':', '!', '?', '@', '#', '$', '%', '^', '&', '*', '(', ')', '[', ']', '{', '}', '"', "'", '/', '\\'];

        for ($i = 0; $i < $length; $i++) {
            $char = mb_substr($value, $i, 1, 'UTF-8');
            $code = mb_ord($char, 'UTF-8');

            // Check if it's an ASCII letter (a-z, A-Z)
            if (($code >= 65 && $code <= 90) || ($code >= 97 && $code <= 122)) {
                continue;
            }

            // Check if it's a digit (0-9)
            if ($code >= 48 && $code <= 57) {
                continue;
            }

            // Check if it's a newline character (LF = 10, CR = 13)
            if ($code === 10 || $code === 13) {
                continue;
            }

            // Check if it's allowed punctuation
            if (in_array($char, $allowedPunctuation, true)) {
                continue;
            }

            // If we get here, the character is not allowed
            $fail(__('common.field_must_be_english_only', ['attribute' => $attribute]));
            return;
        }
    }
}

