<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentMethodFactory extends Factory
{
    public function definition(): array
    {
        return [
            'payment_method_id' => fake()->numberBetween(1, 10),
            'payment_method_ar' => fake('ar')->words(2, true),
            'payment_method_en' => fake()->words(2, true),
            'payment_method_code' => fake()->unique()->bothify('PM##'),
            'is_direct_payment' => true,
            'service_charge' => fake()->randomFloat(2, 0, 10),
            'total_amount' => fake()->randomFloat(2, 10, 1000),
            'currency_iso' => 'KWD',
            'payment_currency_iso' => 'KWD',
            'image_url' => fake()->imageUrl(),
            'is_embedded_supported' => true,
            'is_ios_supported' => true,
            'is_android_supported' => true,
            'is_web_supported' => true,
            'status' => 'active',
        ];
    }
}
