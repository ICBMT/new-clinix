<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['service', 'vendor']),
            'service_id' => Service::factory(),
            'vendor_id' => User::factory(),
            'reason' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => 'pending',
        ];
    }
}
