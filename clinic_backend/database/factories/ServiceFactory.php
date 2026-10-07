<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vendor_id' => \App\Models\User::factory(),
            'category_id' => \App\Models\Category::factory(),
            'name_en' => fake()->words(3, true),
            'name_ar' => fake('ar')->words(3, true),
            'description_en' => fake()->paragraph(),
            'description_ar' => fake('ar')->paragraph(),
            'base_price' => (string) fake()->randomFloat(2, 10, 1000),
            'currency' => 'KWD',
            'working_days' => [1, 2, 3, 4, 5],
            'daily_start_time' => '09:00',
            'daily_end_time' => '18:00',
            'service_duration_minutes' => 60,
            'buffer_time_minutes' => 15,
            'min_advance_booking_hours' => 24,
            'max_advance_booking_days' => 30,
            'auto_confirm' => false,
            'is_featured' => false,
            'status' => 'approved',
            'average_rating' => 0.00,
            'total_reviews' => 0,
            'total_bookings' => 0,
        ];
    }
}
