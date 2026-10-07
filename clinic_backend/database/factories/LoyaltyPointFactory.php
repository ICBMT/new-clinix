<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Booking;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyPointFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'booking_id' => Booking::factory(),
            'coupon_id' => null,
            'type' => fake()->randomElement(['earned', 'redeemed', 'expired']),
            'points' => fake()->numberBetween(10, 1000),
            'description' => fake()->sentence(),
            'expires_at' => now()->addMonths(6),
            'is_expired' => false,
        ];
    }
}
