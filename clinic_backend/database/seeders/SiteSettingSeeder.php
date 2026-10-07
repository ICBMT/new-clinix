<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General Application Settings
            [
                'key' => 'app_timezone',
                'value' => 'Asia/Kuwait',
                'type' => 'text',
                'description' => 'Application timezone setting',
            ],
            [
                'key' => 'app_default_language',
                'value' => 'en',
                'type' => 'select',
                'description' => 'Default application language (en, ar)',
            ],
            [
                'key' => 'app_logo',
                'value' => '',
                'type' => 'url',
                'description' => 'Application logo URL',
            ],
            [
                'key' => 'app_favicon',
                'value' => '',
                'type' => 'url',
                'description' => 'Application favicon URL',
            ],
            [
                'key' => 'app_name_en',
                'value' => 'Clinic App',
                'type' => 'text',
                'description' => 'Application name in English',
            ],
            [
                'key' => 'app_name_ar',
                'value' => 'منصة العيادات',
                'type' => 'text',
                'description' => 'Application name in Arabic',
            ],
            [
                'key' => 'activity_logger_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Enable or disable activity logging system',
            ],

            // Vendor Settings Configuration
            [
                'key' => 'vendor_platform_fee_type',
                'value' => 'fixed',
                'type' => 'select',
                'description' => 'Select whether platform fee is percentage or fixed amount',
            ],
            [
                'key' => 'vendor_platform_fee',
                'value' => '5',
                'type' => 'number',
                'description' => 'Platform fee value',
            ],
            [
                'key' => 'vendor_default_commission',
                'value' => '5',
                'type' => 'number',
                'description' => 'Default vendor commission value',
            ],
            // Fixed charges removed - no longer used

            // Contact Us Settings
            [
                'key' => 'contact_email',
                'value' => 'contact@example.com',
                'type' => 'email',
                'description' => 'Contact email address',
            ],
            [
                'key' => 'contact_email_image',
                'value' => '',
                'type' => 'image',
                'description' => 'Email icon image',
            ],
            [
                'key' => 'contact_phone',
                'value' => '+96512345678',
                'type' => 'text',
                'description' => 'Contact phone number',
            ],
            [
                'key' => 'contact_phone_image',
                'value' => '',
                'type' => 'image',
                'description' => 'Phone icon image',
            ],
            [
                'key' => 'contact_address_en',
                'value' => '123 Main St, Kuwait City, Kuwait',
                'type' => 'textarea',
                'description' => 'Contact address in English',
            ],
            [
                'key' => 'contact_address_ar',
                'value' => 'شارع رئيسي 123، مدينة الكويت، الكويت',
                'type' => 'textarea',
                'description' => 'Contact address in Arabic',
            ],
            [
                'key' => 'contact_address_image',
                'value' => '',
                'type' => 'image',
                'description' => 'Address icon image',
            ],
            [
                'key' => 'contact_instagram',
                'value' => '',
                'type' => 'url',
                'description' => 'Instagram profile URL',
            ],
            [
                'key' => 'contact_instagram_image',
                'value' => '',
                'type' => 'image',
                'description' => 'Instagram icon image',
            ],
            [
                'key' => 'contact_facebook',
                'value' => '',
                'type' => 'url',
                'description' => 'Facebook page URL',
            ],
            [
                'key' => 'contact_facebook_image',
                'value' => '',
                'type' => 'image',
                'description' => 'Facebook icon image',
            ],
            [
                'key' => 'contact_twitter',
                'value' => '',
                'type' => 'url',
                'description' => 'Twitter profile URL',
            ],
            [
                'key' => 'contact_twitter_image',
                'value' => '',
                'type' => 'image',
                'description' => 'Twitter icon image',
            ],
            [
                'key' => 'contact_linkedin',
                'value' => '',
                'type' => 'url',
                'description' => 'LinkedIn profile URL',
            ],
            [
                'key' => 'contact_linkedin_image',
                'value' => '',
                'type' => 'image',
                'description' => 'LinkedIn icon image',
            ],
            [
                'key' => 'contact_whatsapp',
                'value' => '',
                'type' => 'text',
                'description' => 'WhatsApp contact number',
            ],
            [
                'key' => 'contact_whatsapp_image',
                'value' => '',
                'type' => 'image',
                'description' => 'WhatsApp icon image',
            ],

            // Terms & Conditions
            [
                'key' => 'terms_conditions_en',
                'value' => '<h2>Terms and Conditions</h2>
<p><strong>Last Updated:</strong> ' . date('F j, Y') . '</p>

<h3>1. Acceptance of Terms</h3>
<p>By accessing and using the Clinic platform, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our services.</p>

<h3>2. Description of Service</h3>
<p>Clinic is a service booking platform that connects customers with service providers. We facilitate the booking process but are not a party to the actual service delivery between customers and vendors.</p>

<h3>3. User Accounts</h3>
<p>To use our platform, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

<h3>4. Booking and Payment</h3>
<p>When you book a service through our platform:</p>
<ul>
    <li>You agree to pay the total amount displayed at the time of booking</li>
    <li>Payments are processed securely through our payment gateway</li>
    <li>Refunds are subject to our cancellation policy</li>
    <li>All prices are displayed in Kuwaiti Dinar (KWD) unless otherwise stated</li>
</ul>

<h3>5. Cancellation and Refund Policy</h3>
<p>Service cancellations and refunds are subject to the specific cancellation policy of each service provider. Please review the cancellation policy before confirming your booking.</p>

<h3>6. User Conduct</h3>
<p>You agree not to:</p>
<ul>
    <li>Use the platform for any illegal or unauthorized purpose</li>
    <li>Interfere with or disrupt the platform or servers</li>
    <li>Attempt to gain unauthorized access to any part of the platform</li>
    <li>Post false, misleading, or fraudulent information</li>
</ul>

<h3>7. Service Provider Responsibilities</h3>
<p>Service providers are responsible for:</p>
<ul>
    <li>Delivering services as described in their listings</li>
    <li>Maintaining appropriate licenses and insurance</li>
    <li>Complying with all applicable laws and regulations</li>
    <li>Resolving disputes directly with customers</li>
</ul>

<h3>8. Limitation of Liability</h3>
<p>Clinic acts as an intermediary platform. We are not liable for:</p>
<ul>
    <li>The quality, safety, or legality of services provided by vendors</li>
    <li>The accuracy of information provided by service providers</li>
    <li>Any disputes between customers and service providers</li>
</ul>

<h3>9. Intellectual Property</h3>
<p>All content on the Clinic platform, including text, graphics, logos, and software, is the property of Clinic or its content suppliers and is protected by copyright and other intellectual property laws.</p>

<h3>10. Privacy Policy</h3>
<p>Your use of our platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.</p>

<h3>11. Modifications to Terms</h3>
<p>We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon posting. Your continued use of the platform constitutes acceptance of the modified terms.</p>

<h3>12. Governing Law</h3>
<p>These terms and conditions are governed by the laws of the State of Kuwait. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Kuwait.</p>

<h3>13. Contact Information</h3>
<p>If you have any questions about these Terms and Conditions, please contact us at:</p>
<ul>
    <li>Email: support@clinicapp.com</li>
    <li>Phone: +965-1234-5678</li>
</ul>',
                'type' => 'textarea',
                'description' => 'Terms and conditions in English',
            ],
            [
                'key' => 'terms_conditions_ar',
                'value' => '<h2>الشروط والأحكام</h2>
<p><strong>آخر تحديث:</strong> ' . date('j F Y') . '</p>

<h3>1. قبول الشروط</h3>
<p>من خلال الوصول إلى منصة ليلى واستخدامها، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا.</p>

<h3>2. وصف الخدمة</h3>
<p>ليلى هي منصة لحجز الخدمات تربط العملاء بمقدمي الخدمات. نحن نسهل عملية الحجز ولكننا لسنا طرفاً في تقديم الخدمة الفعلية بين العملاء والبائعين.</p>

<h3>3. حسابات المستخدمين</h3>
<p>لاستخدام منصتنا، يجب عليك إنشاء حساب. أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك وعن جميع الأنشطة التي تحدث تحت حسابك.</p>

<h3>4. الحجز والدفع</h3>
<p>عندما تحجز خدمة من خلال منصتنا:</p>
<ul> 
    <li>أنت توافق على دفع المبلغ الإجمالي المعروض في وقت الحجز</li>
    <li>يتم معالجة المدفوعات بشكل آمن من خلال بوابة الدفع الخاصة بنا</li>
    <li>الاستردادات تخضع لسياسة الإلغاء الخاصة بنا</li>
    <li>جميع الأسعار معروضة بالدينار الكويتي (KWD) ما لم يُذكر خلاف ذلك</li>
</ul>

<h3>5. سياسة الإلغاء والاسترداد</h3>
<p>إلغاءات الخدمات والاستردادات تخضع لسياسة الإلغاء المحددة لكل مقدم خدمة. يرجى مراجعة سياسة الإلغاء قبل تأكيد حجزك.</p>

<h3>6. سلوك المستخدم</h3>
<p>أنت توافق على عدم:</p>
<ul>
    <li>استخدام المنصة لأي غرض غير قانوني أو غير مصرح به</li>
    <li>التدخل في المنصة أو الخوادم أو تعطيلها</li>
    <li>محاولة الوصول غير المصرح به إلى أي جزء من المنصة</li>
    <li>نشر معلومات كاذبة أو مضللة أو احتيالية</li>
</ul>

<h3>7. مسؤوليات مقدم الخدمة</h3>
<p>مقدمو الخدمات مسؤولون عن:</p>
<ul>
    <li>تقديم الخدمات كما هو موضح في قوائمهم</li>
    <li>الحفاظ على التراخيص والتأمين المناسبين</li>
    <li>الامتثال لجميع القوانين واللوائح المعمول بها</li>
    <li>حل النزاعات مباشرة مع العملاء</li>
</ul>

<h3>8. تحديد المسؤولية</h3>
<p>تعمل العيادات كمنصة وسيطة. نحن لسنا مسؤولين عن:</p>
<ul>
    <li>جودة أو سلامة أو شرعية الخدمات المقدمة من البائعين</li>
    <li>دقة المعلومات المقدمة من مقدمي الخدمات</li>
    <li>أي نزاعات بين العملاء ومقدمي الخدمات</li>
</ul>

<h3>9. الملكية الفكرية</h3>
<p>جميع المحتويات على منصة العيادات، بما في ذلك النصوص والرسومات والشعارات والبرمجيات، هي ملك للعيادات أو موردي المحتوى الخاص بها ومحمية بموجب قوانين حقوق النشر والملكية الفكرية الأخرى.</p>

<h3>10. سياسة الخصوصية</h3>
<p>استخدامك لمنصتنا يحكمه أيضاً سياسة الخصوصية الخاصة بنا. يرجى مراجعة سياسة الخصوصية لفهم كيفية جمع معلوماتك الشخصية واستخدامها وحمايتها.</p>

<h3>11. تعديلات الشروط</h3>
<p>نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. ستصبح التغييرات سارية فور النشر. استمرارك في استخدام المنصة يعني قبول الشروط المعدلة.</p>

<h3>12. القانون الحاكم</h3>
<p>هذه الشروط والأحكام تحكمها قوانين دولة الكويت. أي نزاعات تنشأ عن هذه الشروط تخضع للاختصاص الحصري لمحاكم الكويت.</p>

<h3>13. معلومات الاتصال</h3>
<p>إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا على:</p>
<ul>
        <li>البريد الإلكتروني: support@clinicapp.com</li>
    <li>الهاتف: +965-1234-5678</li>
</ul>',
                'type' => 'textarea',
                'description' => 'Terms and conditions in Arabic',
            ],

            // Privacy Policy
            [
                'key' => 'privacy_policy_en',
                'value' => '<h2>Privacy Policy</h2>
<p><strong>Last Updated:</strong> ' . date('F j, Y') . '</p>

<h3>1. Introduction</h3>
<p>Welcome to Clinic App. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>

<h3>2. Information We Collect</h3>
<p>We collect information that you provide directly to us, including:</p>
<ul>
    <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, and profile information</li>
    <li><strong>Booking Information:</strong> Service bookings, appointment details, payment information, and transaction history</li>
    <li><strong>Medical Information:</strong> Medical questionnaires, health records, and treatment preferences you choose to share</li>
    <li><strong>Communication Data:</strong> Messages, feedback, and correspondence with service providers</li>
</ul>

<h3>3. How We Use Your Information</h3>
<p>We use the information we collect to:</p>
<ul>
    <li>Provide, maintain, and improve our services</li>
    <li>Process bookings and payments</li>
    <li>Send you booking confirmations, reminders, and updates</li>
    <li>Respond to your inquiries and provide customer support</li>
    <li>Send you marketing communications (with your consent)</li>
    <li>Detect, prevent, and address technical issues and fraudulent activity</li>
    <li>Comply with legal obligations</li>
</ul>

<h3>4. Information Sharing and Disclosure</h3>
<p>We may share your information in the following situations:</p>
<ul>
    <li><strong>With Service Providers:</strong> We share booking and contact information with clinics and service providers to facilitate your appointments</li>
    <li><strong>Payment Processing:</strong> We share payment information with payment processors to complete transactions</li>
    <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
    <li><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, or sale of assets</li>
</ul>

<h3>5. Data Security</h3>
<p>We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

<h3>6. Your Privacy Rights</h3>
<p>You have the right to:</p>
<ul>
    <li>Access and receive a copy of your personal data</li>
    <li>Rectify inaccurate or incomplete information</li>
    <li>Request deletion of your personal data</li>
    <li>Object to processing of your personal data</li>
    <li>Request restriction of processing</li>
    <li>Data portability</li>
</ul>

<h3>7. Cookies and Tracking Technologies</h3>
<p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

<h3>8. Third-Party Links</h3>
<p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.</p>

<h3>9. Children\'s Privacy</h3>
<p>Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.</p>

<h3>10. Changes to This Privacy Policy</h3>
<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

<h3>11. Contact Us</h3>
<p>If you have any questions about this Privacy Policy, please contact us at:</p>
<ul>
    <li>Email: privacy@clinicapp.com</li>
    <li>Phone: +965-1234-5678</li>
    <li>Address: Kuwait City, Kuwait</li>
</ul>',
                'type' => 'textarea',
                'description' => 'Privacy policy in English',
            ],
            [
                'key' => 'privacy_policy_ar',
                'value' => '<h2>سياسة الخصوصية</h2>
<p><strong>آخر تحديث:</strong> ' . date('j F Y') . '</p>

<h3>1. مقدمة</h3>
<p>مرحباً بك في منصة العيادات. نحن ملتزمون بحماية معلوماتك الشخصية وحقك في الخصوصية. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها والكشف عنها وحمايتها عند استخدامك لمنصتنا.</p>

<h3>2. المعلومات التي نجمعها</h3>
<p>نجمع المعلومات التي تقدمها لنا مباشرة، بما في ذلك:</p>
<ul>
    <li><strong>معلومات الحساب:</strong> الاسم وعنوان البريد الإلكتروني ورقم الهاتف وتاريخ الميلاد ومعلومات الملف الشخصي</li>
    <li><strong>معلومات الحجز:</strong> حجوزات الخدمات وتفاصيل المواعيد ومعلومات الدفع وسجل المعاملات</li>
    <li><strong>المعلومات الطبية:</strong> الاستبيانات الطبية والسجلات الصحية وتفضيلات العلاج التي تختار مشاركتها</li>
    <li><strong>بيانات الاتصال:</strong> الرسائل والملاحظات والمراسلات مع مقدمي الخدمات</li>
</ul>

<h3>3. كيفية استخدام معلوماتك</h3>
<p>نستخدم المعلومات التي نجمعها لـ:</p>
<ul>
    <li>توفير خدماتنا وصيانتها وتحسينها</li>
    <li>معالجة الحجوزات والمدفوعات</li>
    <li>إرسال تأكيدات الحجز والتذكيرات والتحديثات</li>
    <li>الرد على استفساراتك وتقديم دعم العملاء</li>
    <li>إرسال الاتصالات التسويقية (بموافقتك)</li>
    <li>اكتشاف المشاكل التقنية والأنشطة الاحتيالية ومنعها ومعالجتها</li>
    <li>الامتثال للالتزامات القانونية</li>
</ul>

<h3>4. مشاركة المعلومات والكشف عنها</h3>
<p>قد نشارك معلوماتك في الحالات التالية:</p>
<ul>
    <li><strong>مع مقدمي الخدمات:</strong> نشارك معلومات الحجز والاتصال مع العيادات ومقدمي الخدمات لتسهيل مواعيدك</li>
    <li><strong>معالجة الدفع:</strong> نشارك معلومات الدفع مع معالجات الدفع لإتمام المعاملات</li>
    <li><strong>المتطلبات القانونية:</strong> قد نكشف عن المعلومات إذا كان ذلك مطلوباً بموجب القانون أو لحماية حقوقنا وسلامتنا</li>
    <li><strong>نقل الأعمال:</strong> قد يتم نقل المعلومات فيما يتعلق بالاندماج أو الاستحواذ أو بيع الأصول</li>
</ul>

<h3>5. أمان البيانات</h3>
<p>نطبق تدابير أمنية تقنية وتنظيمية مناسبة لحماية معلوماتك الشخصية. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100%، ولا يمكننا ضمان الأمان المطلق.</p>

<h3>6. حقوق الخصوصية الخاصة بك</h3>
<p>لديك الحق في:</p>
<ul>
    <li>الوصول إلى بياناتك الشخصية والحصول على نسخة منها</li>
    <li>تصحيح المعلومات غير الدقيقة أو غير الكاملة</li>
    <li>طلب حذف بياناتك الشخصية</li>
    <li>الاعتراض على معالجة بياناتك الشخصية</li>
    <li>طلب تقييد المعالجة</li>
    <li>قابلية نقل البيانات</li>
</ul>

<h3>7. ملفات تعريف الارتباط وتقنيات التتبع</h3>
<p>نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتتبع النشاط على منصتنا والاحتفاظ بمعلومات معينة. يمكنك توجيه متصفحك لرفض جميع ملفات تعريف الارتباط أو للإشارة عند إرسال ملف تعريف ارتباط.</p>

<h3>8. روابط الطرف الثالث</h3>
<p>قد تحتوي منصتنا على روابط لمواقع ويب تابعة لأطراف ثالثة. نحن لسنا مسؤولين عن ممارسات الخصوصية لهذه المواقع الخارجية. نشجعك على مراجعة سياسات الخصوصية الخاصة بهم.</p>

<h3>9. خصوصية الأطفال</h3>
<p>خدماتنا غير مخصصة للأفراد الذين تقل أعمارهم عن 18 عاماً. نحن لا نجمع معلومات شخصية من الأطفال عن قصد.</p>

<h3>10. التغييرات على سياسة الخصوصية هذه</h3>
<p>قد نحدث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".</p>

<h3>11. اتصل بنا</h3>
<p>إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على:</p>
<ul>
    <li>البريد الإلكتروني: privacy@clinicapp.com</li>
    <li>الهاتف: +965-1234-5678</li>
    <li>العنوان: مدينة الكويت، الكويت</li>
</ul>',
                'type' => 'textarea',
                'description' => 'Privacy policy in Arabic',
            ],

            // // Loyalty Settings
            // [
            //     'key' => 'loyalty_milestone',
            //     'value' => '6',
            //     'type' => 'number',
            //     'description' => 'Number of bookings required to earn a clinic coupon (default: 6)',
            // ],
            // [
            //     'key' => 'loyalty_expiry_days',
            //     'value' => '180',
            //     'type' => 'number',
            //     'description' => 'Number of days until clinic rewards expire',
            // ],
            // [
            //     'key' => 'loyalty_max_usage_limit',
            //     'value' => '1',
            //     'type' => 'number',
            //     'description' => 'Maximum usage limit for clinic coupons',
            // ],
            // [
            //     'key' => 'loyalty_discount_type',
            //     'value' => 'fixed',
            //     'type' => 'select',
            //     'description' => 'Default discount type for clinic coupons (percentage or fixed)',
            // ],
            // [
            //     'key' => 'loyalty_discount_value',
            //     'value' => '10',
            //     'type' => 'number',
            //     'description' => 'Default discount value for clinic coupons in KWD',
            // ],
            // [
            //     'key' => 'loyalty_title_en',
            //     'value' => 'Clinic Reward',
            //     'type' => 'text',
            //     'description' => 'Default title for clinic rewards in English',
            // ],
            // [
            //     'key' => 'loyalty_title_ar',
            //     'value' => 'مكافأة العيادات',
            //     'type' => 'text',
            //     'description' => 'Default title for clinic rewards in Arabic',
            // ],
            // [
            //     'key' => 'loyalty_description_en',
            //     'value' => 'Congratulations! You have earned this clinic reward.',
            //     'type' => 'textarea',
            //     'description' => 'Default description for clinic rewards in English',
            // ],
            // [
            //     'key' => 'loyalty_description_ar',
            //     'value' => 'تهانينا! لقد حصلت على هذه المكافأة العيادات.',
            //     'type' => 'textarea',
            //     'description' => 'Default description for clinic rewards in Arabic',
            // ],

            // OTP Configuration
            [
                'key' => 'otp_test_mode',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Enable test mode for OTP service (affects both SMSBox and Twilio)',
            ],
            [
                'key' => 'otp_provider',
                'value' => 'smsbox',
                'type' => 'select',
                'description' => 'OTP provider: smsbox, twilio, or email',
            ],
            [
                'key' => 'otp_digits',
                'value' => '4',
                'type' => 'number',
                'description' => 'Number of digits in OTP code',
            ],
            [
                'key' => 'otp_expiry_minutes',
                'value' => '5',
                'type' => 'number',
                'description' => 'OTP expiry time in minutes',
            ],

            // Twilio Configuration (WhatsApp)
            [
                'key' => 'twilio_sid',
                'value' => 'your_twilio_account_sid',
                'type' => 'text',
                'description' => 'Twilio Account SID for WhatsApp messaging',
            ],
            [
                'key' => 'twilio_auth_token',
                'value' => 'your_twilio_auth_token',
                'type' => 'password',
                'description' => 'Twilio Auth Token for WhatsApp messaging',
            ],
            [
                'key' => 'twilio_whatsapp_from',
                'value' => 'whatsapp:+14155238886',
                'type' => 'text',
                'description' => 'Twilio WhatsApp sender number',
            ],
            [
                'key' => 'whatsapp_otp_template_sid',
                'value' => 'your_whatsapp_template_sid',
                'type' => 'text',
                'description' => 'WhatsApp OTP template SID',
            ],

            // SMSBox Configuration (SMS)
            [
                'key' => 'smsbox_username',
                'value' => 'valueandgrowth',
                'type' => 'text',
                'description' => 'SMSBox username for SMS service',
            ],
            [
                'key' => 'smsbox_password',
                'value' => 'VGA112233@',
                'type' => 'password',
                'description' => 'SMSBox password for SMS service',
            ],
            [
                'key' => 'smsbox_customerid',
                'value' => '3441',
                'type' => 'text',
                'description' => 'SMSBox customer ID',
            ],
            [
                'key' => 'smsbox_sendertext',
                'value' => 'V G A',
                'type' => 'text',
                'description' => 'SMSBox sender text/name',
            ],
            [
                'key' => 'smsbox_endpoint',
                'value' => 'http://smsbox.com/smsgateway/services/messaging.asmx/Http_SendSMS',
                'type' => 'url',
                'description' => 'SMSBox API endpoint URL',
            ],

            // Booking & Cancellation Settings
            // Rescheduling & Cancellation Buffer Time
            [
                'key' => 'booking_rescheduling_buffer_hours',
                'value' => '24',
                'type' => 'number',
                'description' => 'Rescheduling buffer time in hours (minimum time before booking that rescheduling is allowed)',
            ],
            [
                'key' => 'booking_cancellation_buffer_hours',
                'value' => '24',
                'type' => 'number',
                'description' => 'Cancellation buffer time in hours (minimum time before booking that cancellation is allowed)',
            ],
            // Customer Cancellation Penalty
            [
                'key' => 'booking_user_cancellation_penalty_type',
                'value' => 'percentage',
                'type' => 'select',
                'description' => 'Customer cancellation penalty type (fixed amount or percentage)',
            ],
            [
                'key' => 'booking_user_cancellation_penalty_value',
                'value' => '5',
                'type' => 'decimal',
                'description' => 'Customer cancellation penalty value (fixed amount in currency or percentage)',
            ],
            // Vendor Refund Policy
            [
                'key' => 'booking_vendor_refund_policy_type',
                'value' => 'partial',
                'type' => 'select',
                'description' => 'Vendor refund policy type on cancellation (full refund, partial refund with percentage, or fixed amount refund)',
            ],
            [
                'key' => 'booking_vendor_refund_policy_value',
                'value' => '20',
                'type' => 'decimal',
                'description' => 'Vendor refund policy value (percentage for partial refund, fixed amount for fixed refund, ignored for full refund)',
            ],

            // MyFatoorah Configuration
            [
                'key' => 'myfatoorah_api_key',
                'value' => 'SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx',
                'type' => 'password',
                'description' => 'MyFatoorah API key for payment processing',
            ],
            [
                'key' => 'myfatoorah_test_mode',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Enable test mode for MyFatoorah payments',
            ],
            [
                'key' => 'myfatoorah_country_iso',
                'value' => 'KWT',
                'type' => 'text',
                'description' => 'MyFatoorah country ISO code',
            ],
            [
                'key' => 'myfatoorah_save_card',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Allow saving payment cards',
            ],
            [
                'key' => 'myfatoorah_webhook_secret_key',
                'value' => '',
                'type' => 'password',
                'description' => 'MyFatoorah webhook secret key for security',
            ],
            [
                'key' => 'myfatoorah_register_apple_pay',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Register Apple Pay with MyFatoorah',
            ],

            // Contact Support Configuration
            [
                'key' => 'support_email',
                'value' => 'support@spoiledapp.com',
                'type' => 'email',
                'description' => 'Main support email address',
            ],
            [
                'key' => 'support_phone',
                'value' => '+965-1234-5678',
                'type' => 'text',
                'description' => 'Support phone number',
            ],
            [
                'key' => 'support_whatsapp',
                'value' => '+965-1234-5678',
                'type' => 'text',
                'description' => 'Support WhatsApp number',
            ],
            [
                'key' => 'support_address_en',
                'value' => 'Kuwait City, Kuwait',
                'type' => 'text',
                'description' => 'Support address in English',
            ],
            [
                'key' => 'support_address_ar',
                'value' => 'مدينة الكويت، الكويت',
                'type' => 'text',
                'description' => 'Support address in Arabic',
            ],

            // Google Maps Configuration
            [
                'key' => 'google_maps_api_key',
                'value' => 'AIzaSyBC6w0fatv59Xv8reOsL4bc8zJ5fZiNHPU',
                'type' => 'password',
                'description' => 'Google Maps API key for Places Autocomplete and Maps',
            ],

            // Firebase Configuration
            [
                'key' => 'firebase_credentials_json',
                'value' => json_encode([
                    'type' => 'service_account',
                    'project_id' => 'clinic-ee072',
                    'private_key_id' => '742763f3a248f1ffc9ccaf7b1dc452abdad8a868',
                    'private_key' => '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDFhBZLmoDjUwHr\nK4dhw++6Oua6cdabSKOkZA1NTQylfpIr4H3nitcb4LwzSmbdBOhP0vsIwrt7ONxd\n6dTcVsCuIIZz+Z+HYbQ+ST+2JdK+C5ToAYX2gzALPWFZGN+xUuu3We7AGRHY0MkW\nQ7MYRO+U8znzecV/vzleXq6/b/0sHExmlheyEKeGN1stniSR7Iblbm8j5hK5cprJ\nLEfRYgeqZRYx+QLGD/xeTiQn+PQa7Pi7IHhueGXtcZEQOH4yVRFK/UGl4umislt3\nywvnAkcztAA4rZCYIlxOrGnfU2IIIiBnRD0tmOkKmwjUKsIvoCr6CGL5lRrCo8Vu\nlOleFT2rAgMBAAECggEAP1AFU4u9l+DCQy9rUJfdjs0Vq5sVByakKexWZTp2/M+T\nLFRkF2XmaQ3DVg+Z5GwPyZKgHGFLdoa2ALaVIGIAlnBfmOphzCQyAis5rHn4USnm\nO+5NEkVgD6JHw6cZAT7KxzWhNdtzYJQgeS4PSQ7D23OR1m1otPfHfGwOSNgth8cj\nkyLyeBR5c/CBBV+67EuhDU4C8lGYy09t5+NQRQr7wQVyuXMGKrQVOKkVuRFVATPK\nG7y6I8WEiAklCHQhqW8nkB+rVnMo2e26Hyb4YAZLQmHLlHgnhPBwwEMnoHmAiirH\nWnR97erBy6aV6WjEktF/PPVj67ZUFkXCQY6LCdlJEQKBgQD3qSQe9Vd9sRBqHNfk\nKqCR4+MuHwmVXzuNWRD3WG1CnPvL9lahjgD7blA+FJ6MRYDKj5RYLtYspha2jlyc\nnC8hi9pbLe9Jh5Q4pVW38VCfei4D4h/7WIlBlbveb11TWnm1Wvi7zqcjy1We6GUS\n8EmW/X08g5beXt+vBK10pnH0sQKBgQDMKrGLnDFwp0DsRyI3dWU6ElqcKTyAtGht\nk5PssbprQLZgW6y34LlE4/K7SDvyDFwxyHCLT02Zf+1E3EcnfD4jYDc9R/NXaiTO\nrBuCgsO61iRO65SVhX+HjFI/jxIdn2DB5UuONccE3B7FUrTJ6NvHHrlciquAKu6I\nDsEeAh8fGwKBgBGSdLelnMGUUJ/W0BKmW6I+Ux4woZNxoF4VFbkXExmI3ezI27i2\nxKcSWqss91roi4zTxyjCmfutBSuKylNqWYW90I5rofDLp96lDIHyo0/NcXphDvfc\nflCi+SN9L1f8sWoGvGNG9GD7ymVuA83mMrJ95ebnR0sb3C8k29HNBYThAoGAYHif\n8h74wYlWRQ8LnPbswPbhN77IZuxYF8bO8926/2jRhFBtGWmnQWUQUew83w92FNPo\nUftD6I8pFwua145+cgrJrzwrQJfYEowCZ7XQNJ1xBJWOXOR6sRrd1kiNP9AKUTQ+\nclD43FQCeiytXmaYSss6vP6NMP+YPFP0bnCEMhcCgYBEoIRMSFQONb9Ct30QgUU+\n/sq3sjKh0bvWaZL+Op/V5RnKaRAsuHDbjUHQ3TClWOVYvooPNlnlqShWzdkp8UYT\n2C63wGOm660j45/Pu7TTkXMr76Kiu5Bh05icYqs/H/Fr2iFJiDVRE/tEKSzWTp2a\naQ0JVi6mhdbSoGTvdc/uiQ==\n-----END PRIVATE KEY-----\n',
                    'client_email' => 'firebase-adminsdk-fbsvc@clinic-ee072.iam.gserviceaccount.com',
                    'client_id' => '115370758506890110015',
                    'auth_uri' => 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri' => 'https://oauth2.googleapis.com/token',
                    'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
                    'client_x509_cert_url' => 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40clinic-ee072.iam.gserviceaccount.com',
                    'universe_domain' => 'googleapis.com',
                ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
                'type' => 'json',
                'description' => 'Firebase Admin SDK credentials JSON (paste from Firebase service account JSON; leading/trailing spaces will be trimmed automatically)',
            ],
            [
                'key' => 'firebase_web_config_json',
                'value' => json_encode([
                    'apiKey' => 'AIzaSyBO3QNt9MITGzABV8JBmM2EtrtmTl3gQ6o',
                    'authDomain' => 'clinic-ee072.firebaseapp.com',
                    'projectId' => 'clinic-ee072',
                    'storageBucket' => 'clinic-ee072.firebasestorage.app',
                    'messagingSenderId' => '1008658500211',
                    'appId' => '1:1008658500211:web:8ce72f8fc7fac846c93806',
                    'measurementId' => 'G-BZR4508GX8',
                ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
                'type' => 'json',
                'description' => 'Firebase Web SDK configuration JSON (paste from Firebase console; leading/trailing spaces will be trimmed automatically)',
            ],
        ];

        foreach ($settings as $setting) {
            SiteSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
