<?php

namespace App\Enums;

enum BookingReasonType: string
{
    case Cancellation = 'cancellation';
    case Rescheduling = 'rescheduling';

    /**
     * Return available enum values as array.
     */
    public static function values(): array
    {
        return array_map(
            fn (self $case) => $case->value,
            self::cases()
        );
    }
}


