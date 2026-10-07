<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Banner>
 */
class BannerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title_en' => fake()->sentence(),
            'title_ar' => fake('ar')->sentence(),
            'description_en' => fake()->paragraph(),
            'description_ar' => fake('ar')->paragraph(),
            'image_url' => fake()->imageUrl(),
            'link_url' => fake()->url(),
            'type' => 'homepage',
            'position' => 'top',
            'status' => 'active',
            'sort_order' => fake()->numberBetween(1, 10),
            'start_date' => now(),
            'end_date' => now()->addMonths(1),
        ];
    }
}
