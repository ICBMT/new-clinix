<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;

class RefundFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'booking_id' => Booking::factory(),
            'reason_id' => null,
            'amount' => fake()->randomFloat(2, 10, 500),
            'reason' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => 'pending',
        ];
    }
}
