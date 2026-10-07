<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            SiteSettingSeeder::class,
            PaymentMethodSeeder::class,
            LocationSeeder::class, // Categories, Governorates, and Areas
            BookingReasonSeeder::class,
            SkinTypeSeeder::class,
            BodyPartSeeder::class,
            SubscriptionPackageSeeder::class,
            BannerSeeder::class,
            FaqSeeder::class,
            // NotificationSeeder::class,
            // BroadcastSeeder::class,
            // UserSeeder::class,
            // ComprehensiveSeeder::class,
            
        ]);
    }
}
