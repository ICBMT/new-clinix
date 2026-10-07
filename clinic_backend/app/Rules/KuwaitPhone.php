<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * KuwaitPhone Validation Rule
 * 
 * Validates that phone number is in Kuwait format: +965XXXXXXXX
 * - Must start with +965 (Kuwait country code)
 * - Must have exactly 8 digits after +965
 * - Total length: 12 characters
 */
class KuwaitPhone implements ValidationRule
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
        // Check if value matches Kuwait phone format
        if (!preg_match('/^\+965\d{8}$/', $value)) {
            $fail(__('common.kuwait_phone_invalid_format'));
        }
    }
}

