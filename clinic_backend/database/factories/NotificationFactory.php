<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use App\Models\Broadcast;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'title_en' => fake()->sentence(),
            'title_ar' => fake('ar')->sentence(),
            'message_en' => fake()->paragraph(),
            'message_ar' => fake('ar')->paragraph(),
            'recipient_type' => 'users',
            'recipient_id' => User::factory(),
            'is_read' => false,
            'type' => fake()->randomElement(['booking', 'payment', 'system', 'promotion']),
            'notifiable_id' => User::factory(),
            'notifiable_type' => User::class,
            'data' => [],
            'broadcast_id' => null,
        ];
    }
}
