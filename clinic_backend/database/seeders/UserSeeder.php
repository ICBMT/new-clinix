<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Clinic;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable activity logging during bulk seeding to prevent deadlocks
        // activity()->disableLogging();

        $faker = Faker::create();
        $totalUsers = 20;
        // Create $totalUsers Guests
        for ($i = 1; $i <= $totalUsers; $i++) {
            $user = User::firstOrCreate([
                'email' => "guest{$i}@example.com",
            ], [
                'name' => $faker->name(),
                'email' => "guest{$i}@example.com",
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => $faker->randomElement(['active', 'inactive']),
                'last_login_at' => $faker->dateTimeBetween('-30 days', 'now'),
            ]);

            $user->assignRole('user');
        }

        // Create $totalUsers Clinic Managers
        for ($i = 1; $i <= $totalUsers; $i++) {
            $user = User::firstOrCreate([
                'email' => "clinic{$i}@example.com",
            ], [
                'name' => $faker->company() . ' Owner',
                'email' => "clinic{$i}@example.com",
                'password' => Hash::make('password'),
                'phone' => '+965' . $faker->numerify('########'),
                'phone_verified_at' => $faker->boolean(80) ? now() : null,
                'email_verified_at' => now(),
                'description_en' => $faker->paragraph(3),
                'description_ar' => 'وصف الشركة باللغة العربية - ' . $faker->paragraph(2),
                'status' => $faker->randomElement(['active', 'inactive']),
                'last_login_at' => $faker->dateTimeBetween('-30 days', 'now'),
            ]);
            
            // Create or update clinic
            $clinic = Clinic::firstOrCreate([
                'owner_id' => $user->id,
            ], [
                'category_id' => \App\Models\Category::inRandomOrder()->first()?->id,
                'name_en' => $faker->company(),
                'name_ar' => 'شركة ' . $faker->company(),
                'address' => $faker->address(),
                'phone' => '+965' . $faker->numerify('########'),
                'email' => "clinic{$i}@example.com",
                'bio_en' => $faker->paragraph(3),
                'bio_ar' => 'وصف الشركة باللغة العربية - ' . $faker->paragraph(2),
                'status' => $faker->randomElement(['pending', 'approved', 'rejected']),
                'rejection_reason' => $faker->boolean(20) ? $faker->sentence() : null,
                'approved_at' => $faker->boolean(70) ? now() : null,
                'average_rating' => $faker->randomFloat(2, 3.0, 5.0),
                'total_reviews' => $faker->numberBetween(0, 100),
                'total_bookings' => $faker->numberBetween(0, 500),
                'is_featured' => $faker->boolean(20),
                'auto_confirm_bookings' => $faker->boolean(30),
            ]);
            
            // Update latitude and longitude if they're null (for existing clinics)
            if (is_null($clinic->latitude) || is_null($clinic->longitude)) {
                $clinic->update([
                    // Dummy latitude and longitude for Kuwait (Kuwait City area)
                    'latitude' => $faker->randomFloat(8, 29.30, 29.45),
                    'longitude' => $faker->randomFloat(8, 47.90, 48.10),
                ]);
            }
            
            $user->assignRole('clinic');
        }

        // Create $totalUsers users
        for ($i = 1; $i <= $totalUsers; $i++) {
            $user = User::firstOrCreate([
                'email' => "user{$i}@example.com",
            ], [
                'name' => $faker->name(),
                'email' => "user{$i}@example.com",
                'email_verified_at' => now(),
                'phone' => '+965' . $faker->numerify('########'),
                'phone_verified_at' => $faker->boolean(70) ? now() : null,
                'password' => Hash::make('password'),
                'social_id' => $faker->boolean(30) ? $faker->uuid() : null,
                'social_type' => $faker->boolean(30) ? $faker->randomElement(['google', 'facebook', 'apple']) : null,
                'status' => $faker->randomElement(['active', 'inactive']),
                'last_login_at' => $faker->dateTimeBetween('-30 days', 'now'),
            ]);
            
            $user->assignRole('user');
        }

        // Re-enable activity logging after seeding
        // activity()->enableLogging();
    }
}
