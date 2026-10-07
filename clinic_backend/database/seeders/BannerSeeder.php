<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $banners = [
            [
                'name_en' => 'Homepage Hero Banner',
                'name_ar' => 'بانر الصفحة الرئيسية',
                'title_en' => 'Welcome to Our Clinic',
                'title_ar' => 'مرحباً بكم في عيادتنا',
                'description_en' => 'Discover the best healthcare services',
                'description_ar' => 'اكتشف أفضل خدمات الرعاية الصحية',
                'type' => 'homepage',
                'position' => 'top',
                'linkable_type' => null,
                'linkable_id' => null,
                'sort_order' => 1,
                'status' => 'active',
                'start_date' => now(),
                'end_date' => now()->addMonths(3),
            ],
            [
                'name_en' => 'Services Promotion Banner',
                'name_ar' => 'بانر الترويج للخدمات',
                'title_en' => 'Special Offers Available',
                'title_ar' => 'عروض خاصة متاحة',
                'description_en' => 'Book your appointment today and get 20% off',
                'description_ar' => 'احجز موعدك اليوم واحصل على خصم 20%',
                'type' => 'homepage',
                'position' => 'middle',
                'linkable_type' => null,
                'linkable_id' => null,
                'sort_order' => 2,
                'status' => 'active',
                'start_date' => now(),
                'end_date' => now()->addMonths(1),
            ],
        ];

        foreach ($banners as $banner) {
            Banner::updateOrCreate(['name_en' => $banner['name_en']], $banner);
        }
    }
}
