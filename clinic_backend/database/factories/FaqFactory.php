<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FaqFactory extends Factory
{
    public function definition(): array
    {
        return [
            'question_en' => fake()->sentence() . '?',
            'question_ar' => fake('ar')->sentence() . '؟',
            'answer_en' => fake()->paragraph(),
            'answer_ar' => fake('ar')->paragraph(),
            'category' => fake()->randomElement(['general', 'booking', 'payment', 'vendor', 'user']),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(1, 100),
        ];
    }
}
