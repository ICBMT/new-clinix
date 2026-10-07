<?php

namespace Database\Seeders;

use App\Models\BodyPart;
use Illuminate\Database\Seeder;

class BodyPartSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bodyParts = [
            [
                'name_en' => 'Face',
                'name_ar' => 'الوجه',
                'description_en' => 'Facial treatments and procedures',
                'description_ar' => 'علاجات وإجراءات الوجه',
                'status' => 'active',
                'sort_order' => 1,
            ],
            [
                'name_en' => 'Neck',
                'name_ar' => 'الرقبة',
                'description_en' => 'Neck area treatments',
                'description_ar' => 'علاجات منطقة الرقبة',
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name_en' => 'Chest',
                'name_ar' => 'الصدر',
                'description_en' => 'Chest area treatments',
                'description_ar' => 'علاجات منطقة الصدر',
                'status' => 'active',
                'sort_order' => 3,
            ],
            [
                'name_en' => 'Back',
                'name_ar' => 'الظهر',
                'description_en' => 'Back area treatments',
                'description_ar' => 'علاجات منطقة الظهر',
                'status' => 'active',
                'sort_order' => 4,
            ],
            [
                'name_en' => 'Abdomen',
                'name_ar' => 'البطن',
                'description_en' => 'Abdominal area treatments',
                'description_ar' => 'علاجات منطقة البطن',
                'status' => 'active',
                'sort_order' => 5,
            ],
            [
                'name_en' => 'Arms',
                'name_ar' => 'الذراعين',
                'description_en' => 'Arm treatments including upper and lower arms',
                'description_ar' => 'علاجات الذراعين بما في ذلك الذراعين العلويين والسفليين',
                'status' => 'active',
                'sort_order' => 6,
            ],
            [
                'name_en' => 'Legs',
                'name_ar' => 'الساقين',
                'description_en' => 'Leg treatments including thighs and calves',
                'description_ar' => 'علاجات الساقين بما في ذلك الفخذين والربلة',
                'status' => 'active',
                'sort_order' => 7,
            ],
            [
                'name_en' => 'Hands',
                'name_ar' => 'اليدين',
                'description_en' => 'Hand treatments',
                'description_ar' => 'علاجات اليدين',
                'status' => 'active',
                'sort_order' => 8,
            ],
            [
                'name_en' => 'Feet',
                'name_ar' => 'القدمين',
                'description_en' => 'Foot treatments',
                'description_ar' => 'علاجات القدمين',
                'status' => 'active',
                'sort_order' => 9,
            ],
            [
                'name_en' => 'Full Body',
                'name_ar' => 'الجسم كامل',
                'description_en' => 'Full body treatments',
                'description_ar' => 'علاجات الجسم الكامل',
                'status' => 'active',
                'sort_order' => 10,
            ],
            [
                'name_en' => 'Underarms',
                'name_ar' => 'تحت الإبطين',
                'description_en' => 'Underarm area treatments',
                'description_ar' => 'علاجات منطقة تحت الإبطين',
                'status' => 'active',
                'sort_order' => 11,
            ],
            [
                'name_en' => 'Bikini Area',
                'name_ar' => 'منطقة البيكيني',
                'description_en' => 'Bikini area treatments',
                'description_ar' => 'علاجات منطقة البيكيني',
                'status' => 'active',
                'sort_order' => 12,
            ],
        ];

        foreach ($bodyParts as $index => $bodyPart) {
            BodyPart::updateOrCreate(
                [
                    'name_en' => $bodyPart['name_en'],
                ],
                [
                    'name_ar' => $bodyPart['name_ar'],
                    'description_en' => $bodyPart['description_en'] ?? null,
                    'description_ar' => $bodyPart['description_ar'] ?? null,
                    'status' => $bodyPart['status'] ?? 'active',
                    'sort_order' => $bodyPart['sort_order'] ?? $index + 1,
                ]
            );
        }

        $this->command->info('Body parts seeded successfully!');
    }
}
