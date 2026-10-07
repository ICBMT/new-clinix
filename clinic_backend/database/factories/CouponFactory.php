<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'user_id' => null, // Null for public coupons
            'code' => strtoupper(fake()->unique()->bothify('??##')),
            'coupon_type' => fake()->randomElement(['discount_code', 'deal_coupon', 'loyalty_coupon']),
            'title_en' => fake()->words(3, true),
            'title_ar' => fake('ar')->words(3, true),
            'description_en' => fake()->sentence(),
            'description_ar' => fake('ar')->sentence(),
            'discount_type' => fake()->randomElement(['percentage', 'fixed']),
            'discount_value' => (string) fake()->randomFloat(2, 5, 50),
            'minimum_order_amount' => (string) fake()->randomFloat(2, 10, 100),
            'maximum_discount_amount' => (string) fake()->randomFloat(2, 20, 200),
            'usage_limit' => (string) fake()->numberBetween(10, 1000),
            'usage_limit_per_user' => (string) fake()->numberBetween(1, 5),
            'used_count' => '0',
            'valid_from' => now(),
            'valid_until' => now()->addMonth(),
            'status' => 'active',
            'applicable_services' => null,
            'applicable_categories' => null,
        ];
    }
}
