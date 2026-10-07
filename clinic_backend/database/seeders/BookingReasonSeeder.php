<?php

namespace Database\Seeders;

use App\Enums\BookingReasonType;
use App\Models\BookingReason;
use Illuminate\Database\Seeder;

class BookingReasonSeeder extends Seeder
{
    public function run(): void
    {
        $reasons = [
            [
                'type' => BookingReasonType::Cancellation,
                'title_en' => 'Booked by mistake',
                'title_ar' => 'تم الحجز عن طريق الخطأ',
                'description_en' => 'I made this reservation accidentally or no longer need it.',
                'description_ar' => 'قمت بالحجز بالخطأ أو لم أعد بحاجة إلى الموعد.',
            ],
            [
                'type' => BookingReasonType::Cancellation,
                'title_en' => 'Scheduling conflict',
                'title_ar' => 'تعارض في المواعيد',
                'description_en' => 'Another commitment overlaps with this appointment.',
                'description_ar' => 'لدي التزام آخر يتعارض مع هذا الموعد.',
            ],
            [
                'type' => BookingReasonType::Cancellation,
                'title_en' => 'Health is improving',
                'title_ar' => 'تحسن حالتي الصحية',
                'description_en' => 'My symptoms improved and I no longer require the visit.',
                'description_ar' => 'تحسنت حالتي الصحية ولم أعد بحاجة إلى الموعد.',
            ],
            [
                'type' => BookingReasonType::Rescheduling,
                'title_en' => 'Need a different day',
                'title_ar' => 'أحتاج يوماً مختلفاً',
                'description_en' => 'I prefer the same time but on another day.',
                'description_ar' => 'أرغب في نفس الوقت ولكن في يوم آخر.',
            ],
            [
                'type' => BookingReasonType::Rescheduling,
                'title_en' => 'Transportation issues',
                'title_ar' => 'مشاكل في المواصلات',
                'description_en' => 'Transportation or traffic will delay my arrival.',
                'description_ar' => 'مشاكل المواصلات أو الزحام ستؤخر وصولي.',
            ],
            [
                'type' => BookingReasonType::Rescheduling,
                'title_en' => 'Clinic requested change',
                'title_ar' => 'العيادة طلبت التغيير',
                'description_en' => 'The clinic advised me to choose another time slot.',
                'description_ar' => 'طلبت العيادة اختيار موعد آخر.',
            ],
        ];

        foreach ($reasons as $index => $reason) {
            $type = $reason['type'] instanceof BookingReasonType
                ? $reason['type']->value
                : $reason['type'];

            BookingReason::updateOrCreate(
                [
                    'type' => $type,
                    'title_en' => $reason['title_en'],
                ],
                [
                    'title_ar' => $reason['title_ar'] ?? null,
                    'description_en' => $reason['description_en'] ?? null,
                    'description_ar' => $reason['description_ar'] ?? null,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ]
            );
        }
    }
}


