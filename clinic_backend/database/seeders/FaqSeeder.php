<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question_en' => 'How do I book an appointment?',
                'question_ar' => 'كيف يمكنني حجز موعد؟',
                'answer_en' => 'You can book an appointment through our website or mobile app. Simply select the service, choose a date and time, and complete the booking process.',
                'answer_ar' => 'يمكنك حجز موعد من خلال موقعنا الإلكتروني أو تطبيق الهاتف المحمول. ببساطة اختر الخدمة واختر التاريخ والوقت وأكمل عملية الحجز.',
                'category' => 'booking',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'question_en' => 'What payment methods do you accept?',
                'question_ar' => 'ما هي طرق الدفع التي تقبلونها؟',
                'answer_en' => 'We accept cash, credit cards, and online payments through our secure payment gateway.',
                'answer_ar' => 'نقبل النقد وبطاقات الائتمان والمدفوعات عبر الإنترنت من خلال بوابة الدفع الآمنة لدينا.',
                'category' => 'payment',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'question_en' => 'Can I cancel or reschedule my appointment?',
                'question_ar' => 'هل يمكنني إلغاء أو إعادة جدولة موعدي؟',
                'answer_en' => 'Yes, you can cancel or reschedule your appointment up to 24 hours before the scheduled time. Please contact us or use the online portal to make changes.',
                'answer_ar' => 'نعم، يمكنك إلغاء أو إعادة جدولة موعدك حتى 24 ساعة قبل الوقت المحدد. يرجى الاتصال بنا أو استخدام البوابة الإلكترونية لإجراء التغييرات.',
                'category' => 'booking',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'question_en' => 'What are your operating hours?',
                'question_ar' => 'ما هي ساعات العمل لديكم؟',
                'answer_en' => 'Our clinic is open from 9:00 AM to 9:00 PM, Sunday through Thursday. We are closed on Fridays and Saturdays.',
                'answer_ar' => 'عيادتنا مفتوحة من الساعة 9:00 صباحاً حتى 9:00 مساءً، من الأحد إلى الخميس. نحن مغلقون يومي الجمعة والسبت.',
                'category' => 'general',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'question_en' => 'Do you offer home visits?',
                'question_ar' => 'هل تقدمون زيارات منزلية؟',
                'answer_en' => 'Yes, we offer home visit services for certain treatments. Please contact us to check availability and schedule a home visit.',
                'answer_ar' => 'نعم، نقدم خدمات الزيارات المنزلية لبعض العلاجات. يرجى الاتصال بنا للتحقق من التوفر وجدولة زيارة منزلية.',
                'category' => 'services',
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(['question_en' => $faq['question_en']], $faq);
        }
    }
}

