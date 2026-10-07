<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Category;
use App\Models\Governorate;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating categories...');
        $this->createCategories();

        $this->command->info('Creating governorates...');
        $this->createGovernorates();

        $this->command->info('Creating areas...');
        $this->createAreas();

        $this->command->info('Location data seeded successfully!');
    }

    private function createCategories(): void
    {
        $categories = [
            [
                'name_en' => 'Beauty & Wellness',
                'name_ar' => 'الجمال والعافية',
                'description_en' => 'Beauty and wellness services',
                'description_ar' => 'خدمات الجمال والعافية',
                'status' => 'active',
                'sort_order' => 1,
            ],
            [
                'name_en' => 'Dermatology',
                'name_ar' => 'الأمراض الجلدية',
                'description_en' => 'Dermatology and skin care services',
                'description_ar' => 'خدمات الأمراض الجلدية والعناية بالبشرة',
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name_en' => 'Aesthetics',
                'name_ar' => 'التجميل',
                'description_en' => 'Aesthetic and cosmetic services',
                'description_ar' => 'خدمات التجميل والجمال',
                'status' => 'active',
                'sort_order' => 3,
            ],
            [
                'name_en' => 'Laser Treatment',
                'name_ar' => 'العلاج بالليزر',
                'description_en' => 'Laser treatment services',
                'description_ar' => 'خدمات العلاج بالليزر',
                'status' => 'active',
                'sort_order' => 4,
            ],
            [
                'name_en' => 'Hair Removal',
                'name_ar' => 'إزالة الشعر',
                'description_en' => 'Hair removal services',
                'description_ar' => 'خدمات إزالة الشعر',
                'status' => 'active',
                'sort_order' => 5,
            ],
        ];

        foreach ($categories as $categoryData) {
            Category::firstOrCreate(['name_en' => $categoryData['name_en']], $categoryData);
        }
    }

    private function createGovernorates(): void
    {
        $governorates = [
            ['name_en' => 'Capital', 'name_ar' => 'العاصمة', 'is_active' => true],
            ['name_en' => 'Hawalli', 'name_ar' => 'حولي', 'is_active' => true],
            ['name_en' => 'Farwaniya', 'name_ar' => 'الفروانية', 'is_active' => true],
            ['name_en' => 'Ahmadi', 'name_ar' => 'الأحمدي', 'is_active' => true],
            ['name_en' => 'Jahra', 'name_ar' => 'الجهراء', 'is_active' => true],
            ['name_en' => 'Mubarak Al-Kabeer', 'name_ar' => 'مبارك الكبير', 'is_active' => true],
        ];

        foreach ($governorates as $governorateData) {
            Governorate::firstOrCreate(['name_en' => $governorateData['name_en']], $governorateData);
        }
    }

    private function createAreas(): void
    {
        $governorate_areas = [
            'Capital' => [
                ['Kuwait City', 'مدينة الكويت'],
                ['Dasma', 'الدسمة'],
                ['Salmiya', 'السالمية'],
                ['Sharq', 'الشرق'],
                ['Jabriya', 'الجابرية'],
            ],
            'Hawalli' => [
                ['Hawalli', 'حولي'],
                ['Salwa', 'السالمية'],
                ['Mishref', 'مشرف'],
                ['Salmiya', 'السالمية'],
            ],
            'Farwaniya' => [
                ['Farwaniya', 'الفروانية'],
                ['Ardiya', 'الأرطية'],
                ['Jleeb Al-Shuyoukh', 'جليب الشيوخ'],
                ['Abraq Khaitan', 'أبرق خيطان'],
            ],
            'Ahmadi' => [
                ['Ahmadi', 'الأحمدي'],
                ['Fahaheel', 'الفحيحيل'],
                ['Mangaf', 'المنقف'],
                ['Mahboula', 'المهبولة'],
            ],
            'Jahra' => [
                ['Jahra', 'الجهراء'],
                ['Sulaibiya', 'الصليبية'],
                ['Taima', 'تيماء'],
            ],
            'Mubarak Al-Kabeer' => [
                ['Mubarak Al-Kabeer', 'مبارك الكبير'],
                ['Sabah Al-Salem', 'صباح السالم'],
                ['Adan', 'عدان'],
            ],
        ];

        foreach ($governorate_areas as $governorateName => $areas) {
            $governorate = Governorate::where('name_en', $governorateName)->first();
            
            if ($governorate) {
                foreach ($areas as $area) {
                    Area::firstOrCreate(
                        [
                            'governorate_id' => $governorate->id,
                            'name_en' => $area[0]
                        ],
                        [
                            'governorate_id' => $governorate->id,
                            'name_en' => $area[0],
                            'name_ar' => $area[1],
                            'is_active' => true,
                        ]
                    );
                }
            }
        }
    }
}

