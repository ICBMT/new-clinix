<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name_en' => fake()->words(2, true),
            'name_ar' => fake('ar')->words(2, true),
            'description_en' => fake()->sentence(),
            'description_ar' => fake('ar')->sentence(),
            'parent_id' => null,
            'status' => 'active',
            'sort_order' => fake()->numberBetween(1, 100),
        ];
    }
}
