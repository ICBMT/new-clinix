<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Minimum Partial Payment Percentage
    |--------------------------------------------------------------------------
    |
    | This value determines the minimum percentage of the total amount
    | that must be paid when making a partial payment.
    | Default: 30% of total amount
    |
    */
    'min_partial_percentage' => env('MIN_PARTIAL_PAYMENT_PERCENTAGE', 30),

    /*
    |--------------------------------------------------------------------------
    | Payment Methods
    |--------------------------------------------------------------------------
    |
    | Available payment methods in the system
    |
    */
    'methods' => [
        'wallet' => 'Wallet',
        'myfatoorah' => 'MyFatoorah',
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Types
    |--------------------------------------------------------------------------
    |
    | Available payment types
    |
    */
    'types' => [
        'full' => 'Full Payment',
        'partial' => 'Partial Payment',
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | Default currency for payments
    |
    */
    'currency' => env('PAYMENT_CURRENCY', 'KWD'),
];

