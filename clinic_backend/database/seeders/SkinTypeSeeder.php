<?php

namespace Database\Seeders;

use App\Models\SkinType;
use Illuminate\Database\Seeder;

class SkinTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $skinTypes = [
            [
                'name_en' => 'Normal',
                'name_ar' => 'عادي',
                'description_en' => 'Balanced skin with few imperfections, no severe sensitivity, barely visible pores, and a radiant complexion.',
                'description_ar' => 'بشرة متوازنة مع قليل من العيوب، لا توجد حساسية شديدة، مسام بالكاد مرئية، وإشراقة صحية.',
                'status' => 'active',
                'sort_order' => 1,
            ],
            [
                'name_en' => 'Oily',
                'name_ar' => 'دهنية',
                'description_en' => 'Enlarged pores, shiny complexion, blackheads, pimples, and blemishes. Produces more sebum than normal skin.',
                'description_ar' => 'مسام متوسعة، بشرة لامعة، رؤوس سوداء، بثور، وعيوب. تنتج المزيد من الدهون مقارنة بالبشرة العادية.',
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name_en' => 'Dry',
                'name_ar' => 'جافة',
                'description_en' => 'Almost invisible pores, dull and rough complexion, red patches, less elasticity, and more visible lines.',
                'description_ar' => 'مسام بالكاد مرئية، بشرة باهتة وخشنة، بقع حمراء، مرونة أقل، وخطوط أكثر وضوحاً.',
                'status' => 'active',
                'sort_order' => 3,
            ],
            [
                'name_en' => 'Combination',
                'name_ar' => 'مختلطة',
                'description_en' => 'Oily in T-zone (forehead, nose, and chin), normal to dry in other areas. May have larger pores in T-zone.',
                'description_ar' => 'دهنية في المنطقة T (الجبهة والأنف والذقن)، عادية إلى جافة في المناطق الأخرى. قد تكون المسام أكبر في المنطقة T.',
                'status' => 'active',
                'sort_order' => 4,
            ],
            [
                'name_en' => 'Sensitive',
                'name_ar' => 'حساسة',
                'description_en' => 'Prone to redness, itching, burning, and dryness. May react to certain products or environmental factors.',
                'description_ar' => 'عرضة للاحمرار والحكة والحرقان والجفاف. قد تتفاعل مع منتجات معينة أو عوامل بيئية.',
                'status' => 'active',
                'sort_order' => 5,
            ],
            [
                'name_en' => 'Acne-Prone',
                'name_ar' => 'عرضة لحب الشباب',
                'description_en' => 'Frequent breakouts, blackheads, whiteheads, and blemishes. May be oily or combination skin type.',
                'description_ar' => 'ظهور متكرر للبثور، رؤوس سوداء، رؤوس بيضاء، وعيوب. قد تكون من نوع البشرة الدهنية أو المختلطة.',
                'status' => 'active',
                'sort_order' => 6,
            ],
            [
                'name_en' => 'Mature',
                'name_ar' => 'ناضجة',
                'description_en' => 'Shows signs of aging such as fine lines, wrinkles, loss of elasticity, and may be drier.',
                'description_ar' => 'تظهر علامات الشيخوخة مثل الخطوط الدقيقة والتجاعيد وفقدان المرونة، وقد تكون أكثر جفافاً.',
                'status' => 'active',
                'sort_order' => 7,
            ],
            [
                'name_en' => 'Dehydrated',
                'name_ar' => 'مصابة بالجفاف',
                'description_en' => 'Lacks water content, may feel tight, show fine lines, and can be both oily and dehydrated simultaneously.',
                'description_ar' => 'تفتقر إلى محتوى الماء، قد تشعر بالضيق، تظهر خطوط دقيقة، ويمكن أن تكون دهنية ومصابة بالجفاف في نفس الوقت.',
                'status' => 'active',
                'sort_order' => 8,
            ],
        ];

        foreach ($skinTypes as $index => $skinType) {
            SkinType::updateOrCreate(
                [
                    'name_en' => $skinType['name_en'],
                ],
                [
                    'name_ar' => $skinType['name_ar'],
                    'description_en' => $skinType['description_en'] ?? null,
                    'description_ar' => $skinType['description_ar'] ?? null,
                    'status' => $skinType['status'] ?? 'active',
                    'sort_order' => $skinType['sort_order'] ?? $index + 1,
                ]
            );
        }

        $this->command->info('Skin types seeded successfully!');
    }
}
