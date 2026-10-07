<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_reference' => 'BK' . fake()->unique()->numerify('########'),
            'user_id' => \App\Models\User::factory(),
            'vendor_id' => \App\Models\User::factory(),
            'service_id' => \App\Models\Service::factory(),
            'booking_date' => now()->addDays(fake()->numberBetween(1, 30)),
            'start_time' => fake()->time('H:i'),
            'end_time' => fake()->time('H:i'),
            'duration_minutes' => 60,
            'quantity' => 1,
            'base_price' => (string) fake()->randomFloat(2, 10, 500),
            'add_ons_total' => '0.00',
            'subtotal' => (string) fake()->randomFloat(2, 10, 500),
            'discount_amount' => '0.00',
            'tax_amount' => '0.00',
            'total_amount' => (string) fake()->randomFloat(2, 10, 500),
            'currency' => 'KWD',
            'payment_type' => fake()->randomElement(['full', 'partial']),
            'deposit_amount' => '0.00',
            'balance_amount' => '0.00',
            'status' => 'pending',
            'payment_status' => 'pending',
        ];
    }
}
