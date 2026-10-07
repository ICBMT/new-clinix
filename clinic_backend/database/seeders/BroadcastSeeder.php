<?php

namespace Database\Seeders;

use App\Models\Broadcast;
use App\Models\User;
use Illuminate\Database\Seeder;

class BroadcastSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first admin user or create a default one for seeding
        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->first();

        if (!$admin) {
            // If no admin exists, we'll set sent_by to null or skip it
            $adminId = null;
        } else {
            $adminId = $admin->id;
        }

        $broadcasts = [
            [
                'title_en' => 'Welcome to Our Platform',
                'title_ar' => 'مرحباً بكم في منصتنا',
                'description_en' => 'We are excited to have you on board. Explore our services and book your first appointment today!',
                'description_ar' => 'نحن متحمسون لوجودك معنا. استكشف خدماتنا واحجز موعدك الأول اليوم!',
                'recipients' => null,
                'target_roles' => ['user'],
                'scheduled_at' => now(),
                'sent_by' => $adminId,
                'status' => 'sent',
            ],
            [
                'title_en' => 'New Services Available',
                'title_ar' => 'خدمات جديدة متاحة',
                'description_en' => 'Check out our newly added services and treatments. Book now and get special discounts!',
                'description_ar' => 'تحقق من خدماتنا وعلاجاتنا المضافة حديثاً. احجز الآن واحصل على خصومات خاصة!',
                'recipients' => null,
                'target_roles' => ['user'],
                'scheduled_at' => now()->addDays(1),
                'sent_by' => $adminId,
                'status' => 'scheduled',
            ],
            [
                'title_en' => 'System Maintenance Notice',
                'title_ar' => 'إشعار صيانة النظام',
                'description_en' => 'Our system will undergo maintenance on Friday from 2 AM to 4 AM. We apologize for any inconvenience.',
                'description_ar' => 'سيخضع نظامنا للصيانة يوم الجمعة من الساعة 2 صباحاً حتى 4 صباحاً. نعتذر عن أي إزعاج.',
                'recipients' => null,
                'target_roles' => ['user', 'vendor', 'clinic-owner'],
                'scheduled_at' => now()->addDays(3),
                'sent_by' => $adminId,
                'status' => 'scheduled',
            ],
        ];

        foreach ($broadcasts as $broadcast) {
            Broadcast::updateOrCreate(['title_en' => $broadcast['title_en']], $broadcast);
        }
    }
}

