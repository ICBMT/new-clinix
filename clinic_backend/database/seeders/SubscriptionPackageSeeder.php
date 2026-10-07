<?php

namespace Database\Seeders;

use App\Models\SubscriptionPackage;
use Illuminate\Database\Seeder;

class SubscriptionPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            [
                'name_en' => 'Basic Plan',
                'name_ar' => 'الخطة الأساسية',
                'description_en' => 'Perfect for small clinics just getting started',
                'description_ar' => 'مثالية للعيادات الصغيرة التي بدأت للتو',
                'price' => '50.00',
                'currency' => 'KWD',
                'billing_cycle' => 'monthly',
                'duration_days' => 30,
                'features' => [
                    'Up to 10 services',
                    'Basic booking management',
                    'Email support',
                ],
                'max_services' => 10,
                'max_bookings_per_month' => 100,
                'max_machines' => 5,
                'max_treatments' => 10,
                'document_storage_gb' => 5,
                'file_size_limit_mb' => 10,
                'featured_listing' => false,
                'priority_support' => false,
                'analytics_access' => false,
                'basic_reports' => true,
                'advanced_reports' => false,
                'custom_branding' => false,
                'banner_slots_per_month' => 0,
                'featured_clinic_listings' => 0,
                'featured_treatment_slots' => 0,
                'featured_machine_slots' => 0,
                'support_tier' => 'basic',
                'training_sessions' => 0,
                'custom_domain' => false,
                'status' => 'active',
                'sort_order' => 1,
            ],
            [
                'name_en' => 'Professional Plan',
                'name_ar' => 'الخطة المهنية',
                'description_en' => 'Ideal for growing clinics with more needs',
                'description_ar' => 'مثالية للعيادات النامية ذات الاحتياجات الأكبر',
                'price' => '150.00',
                'currency' => 'KWD',
                'billing_cycle' => 'monthly',
                'duration_days' => 30,
                'features' => [
                    'Up to 50 services',
                    'Advanced booking management',
                    'Priority email support',
                    'Basic analytics',
                    'Custom reports',
                ],
                'max_services' => 50,
                'max_bookings_per_month' => 500,
                'max_machines' => 20,
                'max_treatments' => 50,
                'document_storage_gb' => 20,
                'file_size_limit_mb' => 25,
                'featured_listing' => true,
                'priority_support' => true,
                'analytics_access' => true,
                'basic_reports' => true,
                'advanced_reports' => true,
                'custom_branding' => false,
                'banner_slots_per_month' => 2,
                'featured_clinic_listings' => 1,
                'featured_treatment_slots' => 5,
                'featured_machine_slots' => 3,
                'support_tier' => 'basic',
                'training_sessions' => 2,
                'custom_domain' => false,
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name_en' => 'Enterprise Plan',
                'name_ar' => 'الخطة المؤسسية',
                'description_en' => 'For large clinics with advanced requirements',
                'description_ar' => 'للعيادات الكبيرة ذات المتطلبات المتقدمة',
                'price' => '300.00',
                'currency' => 'KWD',
                'billing_cycle' => 'monthly',
                'duration_days' => 30,
                'features' => [
                    'Unlimited services',
                    'Full booking management suite',
                    '24/7 priority support',
                    'Advanced analytics',
                    'Custom reports and insights',
                    'Custom branding',
                    'White-label solution',
                ],
                'max_services' => null,
                'max_bookings_per_month' => null,
                'max_machines' => null,
                'max_treatments' => null,
                'document_storage_gb' => 100,
                'file_size_limit_mb' => 50,
                'featured_listing' => true,
                'priority_support' => true,
                'analytics_access' => true,
                'basic_reports' => true,
                'advanced_reports' => true,
                'custom_branding' => true,
                'banner_slots_per_month' => 10,
                'featured_clinic_listings' => 5,
                'featured_treatment_slots' => 20,
                'featured_machine_slots' => 10,
                'support_tier' => 'basic',
                'training_sessions' => 10,
                'custom_domain' => true,
                'status' => 'active',
                'sort_order' => 3,
            ],
        ];

        foreach ($packages as $package) {
            SubscriptionPackage::updateOrCreate(['name_en' => $package['name_en']], $package);
        }
    }
}

