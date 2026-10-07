<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class NotificationSeeder extends Seeder
{
    /**
     * Seed demo notifications for regular users so the mobile/web apps
     * always have data to render during local testing.
     */
    public function run(): void
    {
        $users = User::role('user')->get();

        if ($users->isEmpty()) {
            $this->command?->warn('⚠️  NotificationSeeder skipped – no users found.');
            return;
        }

        $templates = [
            [
                'type' => 'booking_confirmed',
                'title_en' => 'Booking Confirmed',
                'title_ar' => 'تم تأكيد الحجز',
                'description_en' => 'Your appointment is confirmed. Tap to view the details.',
                'description_ar' => 'تم تأكيد موعدك. اضغط لعرض التفاصيل.',
                'days_ago' => 1,
                'status' => 'unread',
                'data' => [
                    'action' => 'view_booking',
                    'booking_id' => 101,
                ],
            ],
            [
                'type' => 'booking_reminder',
                'title_en' => 'Appointment Reminder',
                'title_ar' => 'تذكير بالموعد',
                'description_en' => 'Your session starts soon. Please arrive 10 minutes early.',
                'description_ar' => 'جلسة علاجك ستبدأ قريبًا. يرجى الحضور قبل 10 دقائق.',
                'days_ago' => 2,
                'status' => 'unread',
                'data' => [
                    'action' => 'view_booking',
                    'booking_id' => 102,
                ],
            ],
            [
                'type' => 'booking_followup',
                'title_en' => 'How Was Your Visit?',
                'title_ar' => 'كيف كانت زيارتك؟',
                'description_en' => 'Share feedback on your last treatment to help other patients.',
                'description_ar' => 'شاركنا رأيك في آخر جلسة علاج لمساعدة المرضى الآخرين.',
                'days_ago' => 3,
                'status' => 'read',
                'data' => [
                    'action' => 'rate_booking',
                    'booking_id' => 103,
                ],
            ],
            [
                'type' => 'payment_received',
                'title_en' => 'Payment Received',
                'title_ar' => 'تم استلام الدفع',
                'description_en' => 'We successfully received your payment. Receipt is ready inside the app.',
                'description_ar' => 'تم استلام دفعتك بنجاح. الإيصال متوفر داخل التطبيق.',
                'days_ago' => 4,
                'status' => 'unread',
                'data' => [
                    'action' => 'view_payment',
                    'payment_id' => 55,
                ],
            ],
            [
                'type' => 'payment_failed',
                'title_en' => 'Payment Attempt Failed',
                'title_ar' => 'فشل محاولة الدفع',
                'description_en' => 'Please update your payment method to confirm the booking.',
                'description_ar' => 'يرجى تحديث وسيلة الدفع لتأكيد الحجز.',
                'days_ago' => 5,
                'status' => 'unread',
                'data' => [
                    'action' => 'update_payment',
                ],
            ],
            [
                'type' => 'payment_refunded',
                'title_en' => 'Refund Processed',
                'title_ar' => 'تمت معالجة الاسترداد',
                'description_en' => 'Your refund is on the way. It may take up to 3 business days.',
                'description_ar' => 'تمت معالجة عملية الاسترداد. قد يستغرق الأمر حتى 3 أيام عمل.',
                'days_ago' => 6,
                'status' => 'read',
                'data' => [
                    'action' => 'view_refund',
                    'refund_id' => 12,
                ],
            ],
            [
                'type' => 'system_announcement',
                'title_en' => 'New Loyalty Program',
                'title_ar' => 'برنامج ولاء جديد',
                'description_en' => 'Earn points for every booking you complete. Activate now to unlock rewards.',
                'description_ar' => 'احصل على نقاط لكل حجز تكمله. فعّل البرنامج للحصول على المكافآت.',
                'days_ago' => 7,
                'status' => 'read',
                'data' => [
                    'action' => 'open_promo',
                    'promo_code' => 'LOYALTY20',
                ],
            ],
            [
                'type' => 'loyalty_bonus',
                'title_en' => 'Bonus Points Added',
                'title_ar' => 'تمت إضافة نقاط إضافية',
                'description_en' => 'You just unlocked an extra 200 loyalty points.',
                'description_ar' => 'لقد حصلت على 200 نقطة ولاء إضافية.',
                'days_ago' => 8,
                'status' => 'unread',
                'data' => [
                    'action' => 'view_points',
                    'points' => 200,
                ],
            ],
            [
                'type' => 'promo_offer',
                'title_en' => 'Weekend Promo 25% OFF',
                'title_ar' => 'عرض نهاية الأسبوع خصم 25%',
                'description_en' => 'Use code WKND25 before Sunday to claim the offer.',
                'description_ar' => 'استخدم الرمز WKND25 قبل يوم الأحد للاستفادة من العرض.',
                'days_ago' => 9,
                'status' => 'unread',
                'data' => [
                    'action' => 'open_promo',
                    'promo_code' => 'WKND25',
                ],
            ],
            [
                'type' => 'clinic_news',
                'title_en' => 'New Clinic Partner',
                'title_ar' => 'شريك عيادة جديد',
                'description_en' => 'SkinCare Pro joined our network with exclusive packages.',
                'description_ar' => 'انضمت عيادة SkinCare Pro إلى شبكتنا مع باقات حصرية.',
                'days_ago' => 10,
                'status' => 'read',
                'data' => [
                    'action' => 'view_clinic',
                    'clinic_id' => 77,
                ],
            ],
            [
                'type' => 'health_tip',
                'title_en' => 'Stay Hydrated',
                'title_ar' => 'حافظ على رطوبتك',
                'description_en' => 'Drink enough water before your laser session for best results.',
                'description_ar' => 'اشرب كمية كافية من الماء قبل جلسة الليزر للحصول على أفضل النتائج.',
                'days_ago' => 11,
                'status' => 'read',
                'data' => [
                    'action' => 'open_article',
                    'article_id' => 34,
                ],
            ],
            [
                'type' => 'session_photos_ready',
                'title_en' => 'Session Photos Ready',
                'title_ar' => 'صور الجلسة جاهزة',
                'description_en' => 'Your before/after photos just arrived. Tap to review them.',
                'description_ar' => 'تم تحميل صور قبل وبعد الجلسة. اضغط لمشاهدتها.',
                'days_ago' => 12,
                'status' => 'unread',
                'data' => [
                    'action' => 'view_media',
                    'booking_id' => 109,
                ],
            ],
            [
                'type' => 'documents_uploaded',
                'title_en' => 'New Documents Available',
                'title_ar' => 'مستندات جديدة متاحة',
                'description_en' => 'The clinic uploaded new treatment documents for you.',
                'description_ar' => 'قامت العيادة برفع مستندات علاج جديدة لك.',
                'days_ago' => 13,
                'status' => 'read',
                'data' => [
                    'action' => 'view_documents',
                    'booking_id' => 110,
                ],
            ],
            [
                'type' => 'waitlist_opening',
                'title_en' => 'Slot Available Tomorrow',
                'title_ar' => 'موعد متاح غدًا',
                'description_en' => 'A waitlist spot opened up. Grab it before someone else does.',
                'description_ar' => 'تم فتح مكان في قائمة الانتظار. احجزه قبل أي شخص آخر.',
                'days_ago' => 14,
                'status' => 'unread',
                'data' => [
                    'action' => 'book_slot',
                    'slot_id' => 205,
                ],
            ],
            [
                'type' => 'app_update',
                'title_en' => 'New App Version',
                'title_ar' => 'إصدار جديد للتطبيق',
                'description_en' => 'Update now for improved performance and fresh UI.',
                'description_ar' => 'قم بالتحديث الآن للحصول على أداء أفضل وواجهة جديدة.',
                'days_ago' => 15,
                'status' => 'read',
                'data' => [
                    'action' => 'open_store',
                ],
            ],
        ];

        Notification::withoutEvents(function () use ($users, $templates) {
            foreach ($users as $user) {
                foreach ($templates as $template) {
                    $createdAt = Carbon::now()->subDays($template['days_ago'])->setTime(10, 0);

                    Notification::updateOrCreate(
                        [
                            'recipient_id' => $user->id,
                            'type' => $template['type'],
                        ],
                        array_merge(Arr::except($template, ['days_ago']), [
                            'recipient_type' => 'users',
                            'delivery_method' => 'push',
                            'status' => $template['status'],
                            'is_read' => $template['status'] === 'read',
                            'notifiable_id' => $user->id,
                            'notifiable_type' => User::class,
                            'data' => $template['data'],
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ])
                    );
                }
            }
        });

        $this->command?->info('✅ Seeded sample notifications for users.');
    }
}

