<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->randomElement(['Home', 'Work', 'Other']),
            'address_line_1' => fake()->streetAddress(),
            'address_line_2' => fake()->secondaryAddress(),
            'city' => 'Kuwait City',
            'state' => 'Asimah',
            'postal_code' => fake()->postcode(),
            'country' => 'Kuwait',
            'latitude' => 29.3759,
            'longitude' => 47.9774,
            'is_default' => false,
            'type' => fake()->randomElement(['home', 'work', 'other']),
        ];
    }
}
