<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Role;
use App\Models\Clinic;
use App\Models\Category;
use App\Models\Treatment;
use App\Models\Machine;
use App\Models\TreatmentSlot;
use App\Models\Booking;
use App\Models\BookingSession;
use App\Models\BookingDocument;
use App\Models\Address;
use App\Models\Governorate;
use App\Models\Area;
// use App\Models\Review; // Review model not yet implemented
use App\Models\Favorite;
use App\Models\Media;
use App\Models\Banner;
use App\Models\Faq;
use App\Models\Transaction;
use App\Models\ClinicSubscription;
use App\Models\SubscriptionPackage;
use App\Models\ClinicOperatingHour;
use App\Models\ClinicEarning;
use App\Models\ClinicPayout;
use App\Models\ClinicUser;
use App\Models\Notification;
use App\Models\DeviceToken;
use App\Models\Broadcast;
use App\Models\PaymentMethod;
use App\Models\SiteSetting;
use App\Models\Otp;
use App\Models\PasswordResetToken;
use Carbon\Carbon;

class ComprehensiveSeeder extends Seeder
{
    private array $data = [];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting comprehensive database seeding...');
        $startTime = microtime(true);

        DB::transaction(function () {
            // Step 1: Load existing data (created by other seeders)
            $this->loadExistingData();

            // Step 2: Clinic-related data (clinics already loaded in loadExistingData)
            $this->createClinicOperatingHours();
            $this->createClinicSubscriptions();
            $this->createClinicUsers();

            // Step 4: Treatment and Machine data
            $this->createMachines();
            $this->createTreatments();
            $this->attachMachinesToTreatments();
            // Treatment slots should be created manually through the dashboard form, not via seeder
            // $this->createTreatmentSlots();

            // Step 5: User-related data
            $this->createAddresses();
            $this->createDeviceTokens();

            // Step 6: Booking-related data
            $this->createBookings();
            $this->createBookingSessions();
            $this->createBookingDocuments();

            // Step 7: Reviews and Favorites
            $this->createReviews();
            $this->createFavorites();

            // Step 8: Media attachments
            $this->createMedia();

            // Step 9: Financial data
            $this->createTransactions();
            $this->createClinicEarnings();
            $this->createClinicPayouts();

            // Step 10: Support and Communication
            $this->createNotifications();

            // Step 11: Authentication tokens
            $this->createOtps();
            $this->createPasswordResetTokens();

            // Step 12: Cleanup and maintenance
            $this->cleanupExpiredTokens();
        });

        $duration = round(microtime(true) - $startTime, 2);
        $this->command->info("✅ Comprehensive database seeding completed successfully in {$duration}s!");
        $this->displaySummary();
    }

    /**
     * Load existing data from other seeders
     */
    private function loadExistingData(): void
    {
        $this->command->info('📥 Loading existing data from other seeders...');

        // Load roles (created by PermissionSeeder)
        $this->data['roles'] = Role::all();
        $this->command->info("   ✅ Loaded " . $this->data['roles']->count() . " roles");

        // Load users (created by UserSeeder)
        $this->data['users'] = User::all();
        // Get clinic owners - users with 'clinic' role (created by UserSeeder) or users who own clinics
        $this->data['vendors'] = User::whereHas('ownedClinics')->get();
        if ($this->data['vendors']->isEmpty()) {
            // Fallback: get users with 'clinic' role (created by UserSeeder)
            $this->data['vendors'] = User::role('clinic')->get();
        }
        $this->data['regularUsers'] = User::role('user')->get();
        $this->command->info("   ✅ Loaded " . $this->data['users']->count() . " users (" . $this->data['vendors']->count() . " vendors, " . $this->data['regularUsers']->count() . " regular users)");

        // Load governorates and areas (created by LocationSeeder)
        $this->data['governorates'] = Governorate::all();
        $this->data['areas'] = Area::all();
        $this->command->info("   ✅ Loaded " . $this->data['governorates']->count() . " governorates and " . $this->data['areas']->count() . " areas");

        // Load categories (created by LocationSeeder)
        $this->data['categories'] = Category::all();
        $this->command->info("   ✅ Loaded " . $this->data['categories']->count() . " categories");

        // Load payment methods (created by PaymentMethodSeeder)
        $this->data['paymentMethods'] = PaymentMethod::all();
        $this->command->info("   ✅ Loaded " . $this->data['paymentMethods']->count() . " payment methods");

        // Load site settings (created by SiteSettingSeeder)
        $this->data['siteSettings'] = SiteSetting::all();
        $this->command->info("   ✅ Loaded " . $this->data['siteSettings']->count() . " site settings");

        // Load subscription packages (created by SubscriptionPackageSeeder)
        $this->data['subscriptionPackages'] = SubscriptionPackage::all();
        $this->command->info("   ✅ Loaded " . $this->data['subscriptionPackages']->count() . " subscription packages");

        // Load clinics (created by UserSeeder)
        $this->data['clinics'] = Clinic::all();
        $this->command->info("   ✅ Loaded " . $this->data['clinics']->count() . " clinics");
    }

    /**
     * Create clinic operating hours
     */
    private function createClinicOperatingHours(): void
    {
        $this->command->info('🕐 Creating clinic operating hours...');

        $clinics = $this->data['clinics'] ?? Clinic::all();
        $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        if ($clinics->isEmpty()) {
            $this->command->warn('⚠️ No clinics found, skipping clinic operating hours creation');
            return;
        }

        $createdCount = 0;
        foreach ($clinics as $clinic) {
            try {
                foreach ($days as $dayIndex => $day) {
                    $isOpen = $dayIndex < 6; // Closed on Friday

                    ClinicOperatingHour::firstOrCreate(
                        [
                            'clinic_id' => $clinic->id,
                            'day_of_week' => $day,
                        ],
                        [
                            'clinic_id' => $clinic->id,
                            'day_of_week' => $day,
                            'is_open' => $isOpen,
                            'closed_all_day' => !$isOpen,
                            'opening_time' => $isOpen ? Carbon::createFromTime(9, 0) : null,
                            'closing_time' => $isOpen ? Carbon::createFromTime(18, 0) : null,
                        ]
                    );
                    $createdCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create operating hours for clinic {$clinic->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 clinic operating hours
        $currentCount = ClinicOperatingHour::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalClinics = Clinic::whereDoesntHave('operatingHours')->take(ceil($needed / 7))->get();
            foreach ($additionalClinics as $clinic) {
                try {
                    foreach ($days as $dayIndex => $day) {
                        if ($currentCount >= 20) break;

                        $isOpen = $dayIndex < 6;
                        ClinicOperatingHour::create([
                            'clinic_id' => $clinic->id,
                            'day_of_week' => $day,
                            'is_open' => $isOpen,
                            'closed_all_day' => !$isOpen,
                            'opening_time' => $isOpen ? Carbon::createFromTime(9, 0) : null,
                            'closing_time' => $isOpen ? Carbon::createFromTime(18, 0) : null,
                        ]);
                        $currentCount++;
                        $createdCount++;
                    }
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional operating hours: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} clinic operating hours (Total: " . ClinicOperatingHour::count() . ")");
    }

    /**
     * Create clinic subscriptions
     */
    private function createClinicSubscriptions(): void
    {
        $this->command->info('📦 Creating clinic subscriptions...');

        $clinics = $this->data['clinics'] ?? Clinic::all();
        $packages = $this->data['subscriptionPackages'] ?? SubscriptionPackage::all();

        if ($packages->isEmpty()) {
            return;
        }

        $createdCount = 0;
        foreach ($clinics->take(30) as $clinic) {
            try {
                $package = $packages->random();

                $subscription = ClinicSubscription::create([
                    'clinic_id' => $clinic->id,
                    'subscription_package_id' => $package->id,
                    'amount_paid' => $package->price,
                    'currency' => $package->currency,
                    'start_date' => now()->subDays(rand(1, 30)),
                    'end_date' => now()->addDays(rand(30, 60)),
                    'status' => 'active',
                    'auto_renew' => rand(0, 1) === 1,
                ]);

                $clinic->update(['subscription_id' => $subscription->id]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create clinic subscription for clinic {$clinic->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 clinic subscriptions
        $currentCount = ClinicSubscription::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalClinics = Clinic::whereDoesntHave('subscriptions')->take($needed)->get();
            foreach ($additionalClinics as $clinic) {
                try {
                    $package = $packages->random();
                    $subscription = ClinicSubscription::create([
                        'clinic_id' => $clinic->id,
                        'subscription_package_id' => $package->id,
                        'amount_paid' => $package->price,
                        'currency' => $package->currency,
                        'start_date' => now()->subDays(rand(1, 30)),
                        'end_date' => now()->addDays(rand(30, 60)),
                        'status' => 'active',
                        'auto_renew' => false,
                    ]);
                    $clinic->update(['subscription_id' => $subscription->id]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional clinic subscription: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} clinic subscriptions (Total: " . ClinicSubscription::count() . ")");
    }

    /**
     * Create clinic users (staff)
     */
    private function createClinicUsers(): void
    {
        if (!Schema::hasTable('clinic_users')) {
            return;
        }

        $this->command->info('👨‍⚕️ Creating clinic users...');

        $clinics = $this->data['clinics'] ?? Clinic::all();
        $users = $this->data['regularUsers'] ?? User::role('user')->get();

        if ($clinics->isEmpty() || $users->isEmpty()) {
            $this->command->warn('⚠️ No clinics or users found, skipping clinic users creation');
            return;
        }

        $createdCount = 0;
        foreach ($clinics->take(30) as $clinic) {
            try {
                $clinicUsers = $users->random(min(3, $users->count()));
                foreach ($clinicUsers as $user) {
                    ClinicUser::firstOrCreate(
                        [
                            'clinic_id' => $clinic->id,
                            'user_id' => $user->id,
                        ]
                    );
                    $createdCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create clinic users for clinic {$clinic->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 clinic users
        $currentCount = ClinicUser::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalClinics = $clinics->take($needed);
            foreach ($additionalClinics as $clinic) {
                try {
                    $user = User::whereDoesntHave('clinics', function ($q) use ($clinic) {
                        $q->where('clinic_id', $clinic->id);
                    })->first();

                    if ($user) {
                        ClinicUser::create([
                            'clinic_id' => $clinic->id,
                            'user_id' => $user->id,
                        ]);
                        $currentCount++;
                        $createdCount++;
                    }
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional clinic user: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} clinic users (Total: " . ClinicUser::count() . ")");
    }

    /**
     * Create machines
     */
    private function createMachines(): void
    {
        $this->command->info('🔧 Creating machines...');

        $clinics = $this->data['clinics'] ?? Clinic::all();
        $categories = $this->data['categories'] ?? Category::all();

        if ($clinics->isEmpty()) {
            $this->command->warn('⚠️ No clinics found, skipping machines creation');
            $this->data['machines'] = collect();
            return;
        }

        if ($categories->isEmpty()) {
            $this->command->warn('⚠️ No categories found, creating machines without category');
        }

        $machineTypes = [
            ['model_en' => 'Laser Hair Removal', 'model_ar' => 'إزالة الشعر بالليزر'],
            ['model_en' => 'RF Skin Tightening', 'model_ar' => 'شد الجلد بالترددات الراديوية'],
            ['model_en' => 'IPL Photofacial', 'model_ar' => 'تجميل الوجه بالضوء النبضي'],
            ['model_en' => 'CoolSculpting', 'model_ar' => 'تبريد الدهون'],
            ['model_en' => 'HydraFacial', 'model_ar' => 'هايدرا فيشال'],
        ];

        $createdCount = 0;
        foreach ($clinics as $clinic) {
            $machineCount = rand(2, 5);
            $category = $categories->isNotEmpty() ? $categories->random() : null;

            for ($i = 0; $i < $machineCount; $i++) {
                try {
                    $machineType = $machineTypes[array_rand($machineTypes)];

                    Machine::create([
                        'clinic_id' => $clinic->id,
                        'category_id' => $category?->id,
                        'serial_number' => 'SN' . now()->format('Ymd') . str_pad($clinic->id, 4, '0', STR_PAD_LEFT) . str_pad($i, 2, '0', STR_PAD_LEFT),
                        'model_en' => $machineType['model_en'],
                        'model_ar' => $machineType['model_ar'],
                        'manufacturer_en' => 'Medical Devices Inc.',
                        'manufacturer_ar' => 'شركة الأجهزة الطبية',
                        'description_en' => 'Professional medical aesthetic machine',
                        'description_ar' => 'جهاز تجميل طبي احترافي',
                        'status' => 'ready',
                        'request_status' => 'approved',
                    ]);
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create machine for clinic {$clinic->id}: " . $e->getMessage());
                }
            }
        }

        // Ensure we have at least 20 machines
        $currentCount = Machine::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalClinics = $clinics->take($needed);
            foreach ($additionalClinics as $clinic) {
                try {
                    $category = $categories->isNotEmpty() ? $categories->random() : null;
                    $machineType = $machineTypes[array_rand($machineTypes)];

                    Machine::create([
                        'clinic_id' => $clinic->id,
                        'category_id' => $category?->id,
                        'serial_number' => 'SN' . now()->format('Ymd') . str_pad($clinic->id, 4, '0', STR_PAD_LEFT) . str_pad($currentCount, 2, '0', STR_PAD_LEFT),
                        'model_en' => $machineType['model_en'],
                        'model_ar' => $machineType['model_ar'],
                        'manufacturer_en' => 'Medical Devices Inc.',
                        'manufacturer_ar' => 'شركة الأجهزة الطبية',
                        'description_en' => 'Professional medical aesthetic machine',
                        'description_ar' => 'جهاز تجميل طبي احترافي',
                        'status' => 'ready',
                        'request_status' => 'approved',
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional machine: " . $e->getMessage());
                }
            }
        }

        $this->data['machines'] = Machine::all();
        $this->command->info("   ✅ Created {$createdCount} machines (Total: " . Machine::count() . ")");
    }

    /**
     * Create treatments
     */
    private function createTreatments(): void
    {
        $this->command->info('💆 Creating treatments...');

        $clinics = $this->data['clinics'] ?? Clinic::all();
        $categories = $this->data['categories'] ?? Category::all();

        if ($clinics->isEmpty()) {
            $this->command->warn('⚠️ No clinics found, skipping treatments creation');
            $this->data['treatments'] = collect();
            return;
        }

        if ($categories->isEmpty()) {
            $this->command->warn('⚠️ No categories found, skipping treatments creation');
            $this->data['treatments'] = collect();
            return;
        }

        $treatments = [
            [
                'name_en' => 'Laser Hair Removal',
                'name_ar' => 'إزالة الشعر بالليزر',
                'description_en' => 'Permanent hair removal using advanced laser technology',
                'description_ar' => 'إزالة الشعر الدائمة باستخدام تقنية الليزر المتقدمة',
                'base_price' => '150.00',
                'final_price' => '150.00',
                'service_duration_minutes' => 60,
                'sessions_required' => 6,
                'sessions_interval_days' => 30,
            ],
            [
                'name_en' => 'Facial Treatment',
                'name_ar' => 'علاج الوجه',
                'description_en' => 'Deep cleansing and rejuvenating facial treatment',
                'description_ar' => 'علاج الوجه العميق المنظف والمجدد',
                'base_price' => '80.00',
                'final_price' => '80.00',
                'service_duration_minutes' => 90,
                'sessions_required' => 1,
            ],
            [
                'name_en' => 'Body Contouring',
                'name_ar' => 'تشكيل الجسم',
                'description_en' => 'Non-invasive body contouring treatment',
                'description_ar' => 'علاج تشكيل الجسم غير الجراحي',
                'base_price' => '200.00',
                'final_price' => '200.00',
                'service_duration_minutes' => 120,
                'sessions_required' => 4,
                'sessions_interval_days' => 14,
            ],
        ];

        $createdCount = 0;
        foreach ($clinics as $clinic) {
            $treatmentCount = rand(3, 8);

            for ($i = 0; $i < $treatmentCount; $i++) {
                try {
                    $treatmentData = $treatments[array_rand($treatments)];
                    $category = $categories->random();

                    Treatment::create(array_merge($treatmentData, [
                        'clinic_id' => $clinic->id,
                        'category_id' => $category->id,
                        'currency' => 'KWD',
                        'status' => 'approved',
                        'is_featured' => rand(0, 1) === 1,
                        'average_rating' => round(rand(30, 50) / 10, 1),
                        'total_reviews' => rand(0, 50),
                        'total_bookings' => rand(0, 100),
                    ]));
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create treatment for clinic {$clinic->id}: " . $e->getMessage());
                }
            }
        }

        // Ensure we have at least 20 treatments
        $currentCount = Treatment::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalClinics = $clinics->take($needed);
            foreach ($additionalClinics as $clinic) {
                try {
                    $treatmentData = $treatments[array_rand($treatments)];
                    $category = $categories->random();

                    Treatment::create(array_merge($treatmentData, [
                        'clinic_id' => $clinic->id,
                        'category_id' => $category->id,
                        'currency' => 'KWD',
                        'status' => 'approved',
                        'is_featured' => rand(0, 1) === 1,
                        'average_rating' => round(rand(30, 50) / 10, 1),
                        'total_reviews' => rand(0, 50),
                        'total_bookings' => rand(0, 100),
                    ]));
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional treatment: " . $e->getMessage());
                }
            }
        }

        $this->data['treatments'] = Treatment::all();
        $this->command->info("   ✅ Created {$createdCount} treatments (Total: " . Treatment::count() . ")");
    }

    /**
     * Attach machines to treatments
     */
    private function attachMachinesToTreatments(): void
    {
        $this->command->info('🔗 Attaching machines to treatments...');

        $treatments = $this->data['treatments'] ?? Treatment::all();
        $machines = $this->data['machines'] ?? Machine::all();

        if ($treatments->isEmpty() || $machines->isEmpty()) {
            $this->command->warn('⚠️ No treatments or machines found, skipping attachment');
            return;
        }

        $attachedCount = 0;
        foreach ($treatments as $treatment) {
            try {
                $clinicMachines = $machines->where('clinic_id', $treatment->clinic_id);

                if ($clinicMachines->isNotEmpty()) {
                    $machineIds = $clinicMachines->random(rand(1, min(3, $clinicMachines->count())))->pluck('id')->toArray();
                    $treatment->machines()->syncWithoutDetaching($machineIds);
                    $attachedCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to attach machines to treatment {$treatment->id}: " . $e->getMessage());
            }
        }

        $this->command->info("   ✅ Attached machines to {$attachedCount} treatments");
    }

    /**
     * Create treatment slots
     */
    private function createTreatmentSlots(): void
    {
        $this->command->info('📅 Creating treatment slots...');

        $treatments = $this->data['treatments'] ?? Treatment::all();

        if ($treatments->isEmpty()) {
            $this->command->warn('⚠️ No treatments found, skipping treatment slots creation');
            return;
        }

        $createdCount = 0;
        foreach ($treatments as $treatment) {
            try {
                // Create slots for the next 60 days
                for ($day = 0; $day < 60; $day++) {
                    $slotDate = now()->addDays($day);

                    // Skip Fridays
                    if ($slotDate->dayOfWeek === Carbon::FRIDAY) {
                        continue;
                    }

                    // Create 4-8 slots per day with better time distribution
                    $slotsPerDay = rand(4, 8);

                    // Define time slots: morning (9-12), afternoon (13-16), evening (17-20)
                    $timeSlots = [];
                    $morningSlots = rand(2, 3);
                    $afternoonSlots = rand(2, 3);
                    $eveningSlots = rand(1, 2);

                    // Morning slots (9 AM - 12 PM)
                    for ($i = 0; $i < $morningSlots; $i++) {
                        $hour = 9 + ($i * 1.5); // 9:00, 10:30, 12:00
                        $timeSlots[] = [
                            'hour' => (int) $hour,
                            'minute' => ($hour - (int) $hour) > 0 ? 30 : 0
                        ];
                    }

                    // Afternoon slots (1 PM - 4 PM)
                    for ($i = 0; $i < $afternoonSlots; $i++) {
                        $hour = 13 + ($i * 1.5); // 13:00, 14:30, 16:00
                        $timeSlots[] = [
                            'hour' => (int) $hour,
                            'minute' => ($hour - (int) $hour) > 0 ? 30 : 0
                        ];
                    }

                    // Evening slots (5 PM - 8 PM)
                    for ($i = 0; $i < $eveningSlots; $i++) {
                        $hour = 17 + ($i * 1.5); // 17:00, 18:30
                        $timeSlots[] = [
                            'hour' => (int) $hour,
                            'minute' => ($hour - (int) $hour) > 0 ? 30 : 0
                        ];
                    }

                    // Shuffle time slots for variety
                    shuffle($timeSlots);

                    // Take only the number of slots we need
                    $timeSlots = array_slice($timeSlots, 0, $slotsPerDay);

                    foreach ($timeSlots as $timeSlot) {
                        $startTime = Carbon::createFromTime($timeSlot['hour'], $timeSlot['minute']);
                        $duration = $treatment->service_duration_minutes ?? 30;
                        $endTime = $startTime->copy()->addMinutes($duration);

                        // Random status with more variety (70% available, 20% booked, 8% blocked, 2% maintenance)
                        $statusRand = rand(1, 100);
                        if ($statusRand <= 70) {
                            $status = 'available';
                        } elseif ($statusRand <= 90) {
                            $status = 'booked';
                        } elseif ($statusRand <= 98) {
                            $status = 'blocked';
                        } else {
                            $status = 'maintenance';
                        }

                        // Sometimes add price variation (90% same price, 10% with discount/premium)
                        $price = $treatment->final_price;
                        if (rand(1, 100) <= 10) {
                            $priceVariation = rand(1, 2) === 1 ? 0.9 : 1.1; // 10% discount or premium
                            $price = $treatment->final_price * $priceVariation;
                        }

                        // Random buffer time (0-15 minutes)
                        $bufferTime = rand(0, 3) === 0 ? rand(5, 15) : 0;

                        // Max bookings per slot (usually 1, sometimes 2-3 for group treatments)
                        $maxBookings = rand(1, 100) <= 85 ? 1 : rand(2, 3);

                        TreatmentSlot::create([
                            'treatment_id' => $treatment->id,
                            'slot_date' => $slotDate,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'status' => $status,
                            'price' => $price,
                            'max_bookings_per_slot' => $maxBookings,
                            'slot_duration' => $duration,
                            'buffer_time_minutes' => $bufferTime > 0 ? $bufferTime : null,
                            'notes_en' => rand(1, 10) === 1 ? 'Special slot - ' . ['Early morning', 'Lunch time', 'Evening special', 'Weekend slot'][rand(0, 3)] : null,
                            'notes_ar' => rand(1, 10) === 1 ? 'فتحة خاصة - ' . ['صباح مبكر', 'وقت الغداء', 'مساء خاص', 'فتحة نهاية الأسبوع'][rand(0, 3)] : null,
                        ]);
                        $createdCount++;
                    }
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create slots for treatment {$treatment->id}: " . $e->getMessage());
            }
        }

        $this->command->info("   ✅ Created {$createdCount} treatment slots");
    }

    /**
     * Create addresses
     */
    private function createAddresses(): void
    {
        $this->command->info('🏠 Creating addresses...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();
        $governorates = $this->data['governorates'] ?? Governorate::all();
        $areas = $this->data['areas'] ?? Area::all();

        if ($users->isEmpty()) {
            return;
        }

        $createdCount = 0;
        foreach ($users->take(30) as $index => $user) {
            try {
                $governorate = $governorates->isNotEmpty() ? $governorates->random() : null;
                $area = $governorate && $areas->isNotEmpty()
                    ? ($areas->where('governorate_id', $governorate->id)->random() ?? $areas->random())
                    : ($areas->isNotEmpty() ? $areas->random() : null);

                Address::create([
                    'user_id' => $user->id,
                    'governorate_id' => $governorate?->id,
                    'area_id' => $area?->id,
                    'title' => ['Home', 'Work', 'Other'][rand(0, 2)],
                    'address_line_1' => 'Street ' . ($index + 1) . ', Block ' . ($index + 1),
                    'city' => $area?->name_en ?? 'Kuwait City',
                    'state' => $governorate?->name_en ?? 'Capital',
                    'country' => 'Kuwait',
                    'postal_code' => '12345',
                    'latitude' => 29.3759 + (rand(-100, 100) / 1000),
                    'longitude' => 47.9774 + (rand(-100, 100) / 1000),
                    'is_default' => $index === 0,
                    'type' => 'home',
                    'phone' => $user->phone,
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create address for user {$user->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 addresses
        $currentCount = Address::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalUsers = User::whereDoesntHave('addresses')->take($needed)->get();
            foreach ($additionalUsers as $index => $user) {
                try {
                    $governorate = $governorates->isNotEmpty() ? $governorates->random() : null;
                    $area = $governorate && $areas->isNotEmpty()
                        ? ($areas->where('governorate_id', $governorate->id)->random() ?? $areas->random())
                        : ($areas->isNotEmpty() ? $areas->random() : null);

                    Address::create([
                        'user_id' => $user->id,
                        'governorate_id' => $governorate?->id,
                        'area_id' => $area?->id,
                        'title' => ['Home', 'Work', 'Other'][rand(0, 2)],
                        'address_line_1' => 'Street ' . ($currentCount + $index + 1) . ', Block ' . ($currentCount + $index + 1),
                        'city' => $area?->name_en ?? 'Kuwait City',
                        'state' => $governorate?->name_en ?? 'Capital',
                        'country' => 'Kuwait',
                        'postal_code' => '12345',
                        'latitude' => 29.3759 + (rand(-100, 100) / 1000),
                        'longitude' => 47.9774 + (rand(-100, 100) / 1000),
                        'is_default' => false,
                        'type' => 'home',
                        'phone' => $user->phone,
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional address: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} addresses (Total: " . Address::count() . ")");
    }

    /**
     * Create device tokens
     */
    private function createDeviceTokens(): void
    {
        $this->command->info('📱 Creating device tokens...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();

        $createdCount = 0;
        foreach ($users->take(30) as $user) {
            try {
                DeviceToken::create([
                    'user_id' => $user->id,
                    'token' => 'device_token_' . Str::random(40),
                    'type' => ['android', 'ios'][rand(0, 1)],
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create device token for user {$user->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 device tokens
        $currentCount = DeviceToken::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalUsers = User::whereDoesntHave('deviceTokens')->take($needed)->get();
            foreach ($additionalUsers as $user) {
                try {
                    DeviceToken::create([
                        'user_id' => $user->id,
                        'token' => 'device_token_' . Str::random(40),
                        'type' => ['android', 'ios'][rand(0, 1)],
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional device token: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} device tokens (Total: " . DeviceToken::count() . ")");
    }

    /**
     * Create bookings
     */
    private function createBookings(): void
    {
        $this->command->info('📋 Creating bookings...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();
        $treatments = $this->data['treatments'] ?? Treatment::all();
        $addresses = Address::all();

        if ($users->isEmpty() || $treatments->isEmpty()) {
            return;
        }

        // Create at least 20 bookings, but create more for relationships
        $bookingCount = max(20, 100);
        $createdCount = 0;
        for ($i = 0; $i < $bookingCount; $i++) {
            try {
                $user = $users->random();
                $treatment = $treatments->random();
                $clinic = $treatment->clinic;
                $address = $addresses->where('user_id', $user->id)->first();
                $machine = $treatment->machines->isNotEmpty() ? $treatment->machines->random() : null;

                $basePrice = $treatment->base_price;
                $subtotal = $basePrice;
                $taxAmount = $subtotal * 0.05; // 5% tax
                $totalAmount = $subtotal + $taxAmount;

                $status = ['pending', 'under_review', 'confirmed', 'completed', 'canceled', 'rejected'][rand(0, 5)];
                $paymentStatus = ['pending', 'paid', 'partial', 'refunded'][rand(0, 3)];

                $booking = Booking::create([
                    'booking_reference' => 'BK' . now()->format('Ymd') . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'user_id' => $user->id,
                    'clinic_id' => $clinic->id,
                    'treatment_id' => $treatment->id,
                    'machine_id' => $machine?->id,
                    'total_sessions' => $treatment->sessions_required ?? 1,
                    'base_price' => $basePrice,
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'currency' => $treatment->currency,
                    'payment_type' => ['full', 'partial'][rand(0, 1)],
                    'deposit_amount' => $paymentStatus === 'partial' ? $totalAmount * 0.5 : null,
                    'balance_amount' => $paymentStatus === 'partial' ? $totalAmount * 0.5 : null,
                    'balance_due_date' => $paymentStatus === 'partial' ? now()->addDays(7) : null,
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'confirmed_at' => $status === 'confirmed' ? now()->subDays(rand(1, 10)) : null,
                    'completed_at' => $status === 'completed' ? now()->subDays(rand(1, 5)) : null,
                    'cancelled_at' => $status === 'canceled' ? now()->subDays(rand(1, 3)) : null,
                    'rejected_at' => $status === 'rejected' ? now()->subDays(rand(1, 2)) : null,
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create booking: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 bookings
        $currentCount = Booking::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            for ($i = 0; $i < $needed; $i++) {
                try {
                    $user = $users->random();
                    $treatment = $treatments->random();
                    $clinic = $treatment->clinic;
                    $address = $addresses->where('user_id', $user->id)->first();
                    $machine = $treatment->machines->isNotEmpty() ? $treatment->machines->random() : null;

                    $basePrice = $treatment->base_price;
                    $subtotal = $basePrice;
                    $taxAmount = $subtotal * 0.05;
                    $totalAmount = $subtotal + $taxAmount;
                    $status = ['pending', 'confirmed', 'completed'][rand(0, 2)];
                    $paymentStatus = ['pending', 'paid'][rand(0, 1)];

                    Booking::create([
                        'booking_reference' => 'BK' . now()->format('Ymd') . str_pad($currentCount + $i, 4, '0', STR_PAD_LEFT),
                        'user_id' => $user->id,
                        'clinic_id' => $clinic->id,
                        'treatment_id' => $treatment->id,
                        'machine_id' => $machine?->id,
                        'total_sessions' => $treatment->sessions_required ?? 1,
                        'base_price' => $basePrice,
                        'subtotal' => $subtotal,
                        'tax_amount' => $taxAmount,
                        'total_amount' => $totalAmount,
                        'currency' => $treatment->currency,
                        'payment_type' => 'full',
                        'status' => $status,
                        'payment_status' => $paymentStatus,
                        'confirmed_at' => $status === 'confirmed' ? now()->subDays(rand(1, 10)) : null,
                        'completed_at' => $status === 'completed' ? now()->subDays(rand(1, 5)) : null,
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional booking: " . $e->getMessage());
                }
            }
        }

        $this->data['bookings'] = Booking::all();
        $this->command->info("   ✅ Created {$createdCount} bookings (Total: " . Booking::count() . ")");
    }

    /**
     * Create booking sessions
     */
    private function createBookingSessions(): void
    {
        $this->command->info('📆 Creating booking sessions...');

        $bookings = $this->data['bookings'] ?? Booking::all();
        $slots = TreatmentSlot::all();

        if ($bookings->isEmpty() || $slots->isEmpty()) {
            $this->command->warn('⚠️ No bookings or slots found, skipping booking sessions creation');
            return;
        }

        $createdCount = 0;
        foreach ($bookings as $booking) {
            try {
                $treatment = $booking->treatment;
                $sessionsCount = $booking->total_sessions ?? 1;

                for ($i = 0; $i < $sessionsCount; $i++) {
                    $availableSlots = $slots
                        ->where('treatment_id', $treatment->id)
                        ->where('status', 'available');

                    if ($availableSlots->isNotEmpty()) {
                        $slot = $availableSlots->random();

                        BookingSession::create([
                            'booking_id' => $booking->id,
                            'treatment_slot_id' => $slot->id,
                            'slot_date' => $slot->slot_date,
                            'slot_time' => $slot->start_time,
                        ]);

                        $slot->update(['status' => 'booked']);
                        $createdCount++;
                    }
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create booking sessions for booking {$booking->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 booking sessions
        $currentCount = BookingSession::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalBookings = $bookings->take($needed);
            foreach ($additionalBookings as $booking) {
                try {
                    $treatment = $booking->treatment;
                    $availableSlots = $slots
                        ->where('treatment_id', $treatment->id)
                        ->where('status', 'available');

                    if ($availableSlots->isNotEmpty()) {
                        $slot = $availableSlots->random();

                        BookingSession::create([
                            'booking_id' => $booking->id,
                            'treatment_slot_id' => $slot->id,
                            'slot_date' => $slot->slot_date,
                            'slot_time' => $slot->start_time,
                        ]);

                        $slot->update(['status' => 'booked']);
                        $currentCount++;
                        $createdCount++;
                    }
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional booking session: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} booking sessions (Total: " . BookingSession::count() . ")");
    }

    /**
     * Create booking documents
     */
    private function createBookingDocuments(): void
    {
        $this->command->info('📄 Creating booking documents...');

        $bookings = $this->data['bookings'] ?? Booking::all();

        if ($bookings->isEmpty()) {
            $this->command->warn('⚠️ No bookings found, skipping booking documents creation');
            return;
        }

        $createdCount = 0;
        foreach ($bookings->take(30) as $booking) {
            try {
                BookingDocument::create([
                    'booking_id' => $booking->id,
                    'name' => 'Medical Report ' . $booking->booking_reference,
                    'file_path' => '/storage/documents/report_' . $booking->id . '.pdf',
                    'file_name' => 'report_' . $booking->id . '.pdf',
                    'file_type' => 'application/pdf',
                    'file_size' => rand(100000, 5000000),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create booking document for booking {$booking->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 booking documents
        $currentCount = BookingDocument::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalBookings = Booking::whereDoesntHave('documents')->take($needed)->get();
            foreach ($additionalBookings as $booking) {
                try {
                    BookingDocument::create([
                        'booking_id' => $booking->id,
                        'name' => 'Medical Report ' . $booking->booking_reference,
                        'file_path' => '/storage/documents/report_' . $booking->id . '.pdf',
                        'file_name' => 'report_' . $booking->id . '.pdf',
                        'file_type' => 'application/pdf',
                        'file_size' => rand(100000, 5000000),
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional booking document: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} booking documents (Total: " . BookingDocument::count() . ")");
    }

    /**
     * Create reviews (polymorphic)
     */
    private function createReviews(): void
    {
        $this->command->info('⭐ Creating reviews...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();
        $treatments = $this->data['treatments'] ?? Treatment::all();
        $clinics = $this->data['clinics'] ?? Clinic::all();
        $machines = $this->data['machines'] ?? Machine::all();
        $bookings = $this->data['bookings'] ?? Booking::where('status', 'completed')->get();

        $comments = [
            'Great service! Highly recommended.',
            'Excellent treatment and professional staff.',
            'Very satisfied with the results.',
            'Good service but could be better.',
            'Amazing experience!',
        ];

        $createdCount = 0;

        // Reviews for treatments (at least 20)
        // TODO: Uncomment when Review model is implemented
        /*
        $treatmentReviews = min(20, $treatments->count());
        foreach ($treatments->take($treatmentReviews) as $treatment) {
            try {
                $user = $users->random();

                Review::create([
                    'user_id' => $user->id,
                    'reviewable_type' => Treatment::class,
                    'reviewable_id' => $treatment->id,
                    'rating' => rand(3, 5),
                    'comment' => $comments[array_rand($comments)],
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create review for treatment {$treatment->id}: " . $e->getMessage());
            }
        }

        // Reviews for clinics (at least 20)
        $clinicReviews = min(20, $clinics->count());
        foreach ($clinics->take($clinicReviews) as $clinic) {
            try {
                $user = $users->random();

                Review::create([
                    'user_id' => $user->id,
                    'reviewable_type' => Clinic::class,
                    'reviewable_id' => $clinic->id,
                    'rating' => rand(3, 5),
                    'comment' => $comments[array_rand($comments)],
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create review for clinic {$clinic->id}: " . $e->getMessage());
            }
        }

        // Reviews for machines (at least 20)
        $machineReviews = min(20, $machines->count());
        foreach ($machines->take($machineReviews) as $machine) {
            try {
                $user = $users->random();

                Review::create([
                    'user_id' => $user->id,
                    'reviewable_type' => Machine::class,
                    'reviewable_id' => $machine->id,
                    'rating' => rand(4, 5),
                    'comment' => $comments[array_rand($comments)],
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create review for machine {$machine->id}: " . $e->getMessage());
            }
        }

        // Reviews for bookings (at least 20)
        $bookingReviews = min(20, $bookings->count());
        foreach ($bookings->take($bookingReviews) as $booking) {
            try {
                Review::create([
                    'user_id' => $booking->user_id,
                    'reviewable_type' => Booking::class,
                    'reviewable_id' => $booking->id,
                    'rating' => rand(3, 5),
                    'comment' => $comments[array_rand($comments)],
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create review for booking {$booking->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 reviews total
        $currentCount = Review::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            for ($i = 0; $i < $needed; $i++) {
                try {
            $user = $users->random();
                    $reviewable = collect([
                        $treatments->random(),
                        $clinics->random(),
                        $machines->random(),
                        $bookings->random(),
                    ])->random();

                    Review::create([
                'user_id' => $user->id,
                        'reviewable_type' => get_class($reviewable),
                        'reviewable_id' => $reviewable->id,
                        'rating' => rand(3, 5),
                        'comment' => $comments[array_rand($comments)],
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional review: " . $e->getMessage());
                }
            }
        }
        */

        $this->command->info("   ⏭️  Skipped reviews creation (Review model not yet implemented)");
    }

    /**
     * Create favorites (polymorphic)
     */
    private function createFavorites(): void
    {
        $this->command->info('❤️ Creating favorites...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();
        $treatments = $this->data['treatments'] ?? Treatment::all();
        $clinics = $this->data['clinics'] ?? Clinic::all();
        $machines = $this->data['machines'] ?? Machine::all();

        $createdCount = 0;
        foreach ($users->take(30) as $user) {
            try {
                // Favorite treatments
                $favoriteTreatments = $treatments->isNotEmpty() ? $treatments->random(min(5, $treatments->count())) : collect();
                foreach ($favoriteTreatments as $treatment) {
                    Favorite::firstOrCreate([
                        'user_id' => $user->id,
                        'favoritable_type' => Treatment::class,
                        'favoritable_id' => $treatment->id,
                    ]);
                    $createdCount++;
                }

                // Favorite clinics
                $favoriteClinics = $clinics->isNotEmpty() ? $clinics->random(min(3, $clinics->count())) : collect();
                foreach ($favoriteClinics as $clinic) {
                    Favorite::firstOrCreate([
                        'user_id' => $user->id,
                        'favoritable_type' => Clinic::class,
                        'favoritable_id' => $clinic->id,
                    ]);
                    $createdCount++;
                }

                // Favorite machines
                $favoriteMachines = $machines->isNotEmpty() ? $machines->random(min(2, $machines->count())) : collect();
                foreach ($favoriteMachines as $machine) {
                    Favorite::firstOrCreate([
                        'user_id' => $user->id,
                        'favoritable_type' => Machine::class,
                        'favoritable_id' => $machine->id,
                    ]);
                    $createdCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create favorites for user {$user->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 favorites
        $currentCount = Favorite::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalUsers = $users->take($needed);
            foreach ($additionalUsers as $user) {
                try {
                    $favoritable = collect([
                        $treatments->isNotEmpty() ? $treatments->random() : null,
                        $clinics->isNotEmpty() ? $clinics->random() : null,
                        $machines->isNotEmpty() ? $machines->random() : null,
                    ])->filter()->random();

                    if ($favoritable) {
                        Favorite::firstOrCreate([
                            'user_id' => $user->id,
                            'favoritable_type' => get_class($favoritable),
                            'favoritable_id' => $favoritable->id,
                        ]);
                        $currentCount++;
                        $createdCount++;
                    }
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional favorite: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} favorites (Total: " . Favorite::count() . ")");
    }

    /**
     * Create media (polymorphic)
     */
    private function createMedia(): void
    {
        $this->command->info('📸 Creating media...');

        $treatments = $this->data['treatments'] ?? Treatment::all();
        $clinics = $this->data['clinics'] ?? Clinic::all();
        $machines = $this->data['machines'] ?? Machine::all();
        $users = $this->data['regularUsers'] ?? User::role('user')->get();
        $bookings = $this->data['bookings'] ?? Booking::all();

        $createdCount = 0;

        // Media for treatments (at least 20)
        $treatmentMedia = min(20, $treatments->count());
        foreach ($treatments->take($treatmentMedia) as $treatment) {
            try {
                Media::create([
                    'file_name' => '/storage/treatments/treatment_' . $treatment->id . '.jpg',
                    'mediable_type' => Treatment::class,
                    'mediable_id' => $treatment->id,
                    'collection_name' => 'images',
                    'disk' => 'public',
                    'size' => rand(100000, 2000000),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create media for treatment {$treatment->id}: " . $e->getMessage());
            }
        }

        // Media for clinics (at least 20)
        $clinicMedia = min(20, $clinics->count());
        foreach ($clinics->take($clinicMedia) as $clinic) {
            try {
                Media::create([
                    'file_name' => '/storage/clinics/clinic_' . $clinic->id . '.jpg',
                    'mediable_type' => Clinic::class,
                    'mediable_id' => $clinic->id,
                    'collection_name' => 'images',
                    'disk' => 'public',
                    'size' => rand(100000, 2000000),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create media for clinic {$clinic->id}: " . $e->getMessage());
            }
        }

        // Media for machines (at least 20)
        $machineMedia = min(20, $machines->count());
        foreach ($machines->take($machineMedia) as $machine) {
            try {
                Media::create([
                    'file_name' => '/storage/machines/machine_' . $machine->id . '.jpg',
                    'mediable_type' => Machine::class,
                    'mediable_id' => $machine->id,
                    'collection_name' => 'images',
                    'disk' => 'public',
                    'size' => rand(100000, 2000000),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create media for machine {$machine->id}: " . $e->getMessage());
            }
        }

        // Medical records for users (at least 20)
        $userMedia = min(20, $users->count());
        foreach ($users->take($userMedia) as $user) {
            try {
                Media::create([
                    'file_name' => '/storage/medical-records/user_' . $user->id . '_record.pdf',
                    'mediable_type' => User::class,
                    'mediable_id' => $user->id,
                    'collection_name' => 'medical-records',
                    'disk' => 'public',
                    'size' => rand(500000, 5000000),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create media for user {$user->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 media records total
        $currentCount = Media::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            for ($i = 0; $i < $needed; $i++) {
                try {
                    $mediableOptions = collect([
                        $treatments->isNotEmpty() ? $treatments->random() : null,
                        $clinics->isNotEmpty() ? $clinics->random() : null,
                        $machines->isNotEmpty() ? $machines->random() : null,
                        $users->isNotEmpty() ? $users->random() : null,
                    ])->filter();

                    if ($mediableOptions->isNotEmpty()) {
                        $mediable = $mediableOptions->random();
                        Media::create([
                            'file_name' => '/storage/media/item_' . $mediable->id . '_' . ($currentCount + $i) . '.jpg',
                            'mediable_type' => get_class($mediable),
                            'mediable_id' => $mediable->id,
                            'collection_name' => 'images',
                            'disk' => 'public',
                            'size' => rand(100000, 2000000),
                        ]);
                        $currentCount++;
                        $createdCount++;
                    }
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional media: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} media records (Total: " . Media::count() . ")");
    }

    /**
     * Create transactions (polymorphic)
     */
    private function createTransactions(): void
    {
        $this->command->info('💵 Creating transactions...');

        $bookings = $this->data['bookings'] ?? Booking::where('payment_status', 'paid')->get();

        if ($bookings->isEmpty()) {
            $this->command->warn('⚠️ No bookings found, skipping transactions creation');
            return;
        }

        $createdCount = 0;
        foreach ($bookings->take(50) as $index => $booking) {
            try {
                Transaction::create([
                    'transaction_id' => 'TXN' . now()->format('Ymd') . str_pad($index, 4, '0', STR_PAD_LEFT),
                    'transactionable_type' => Booking::class,
                    'transactionable_id' => $booking->id,
                    'type' => 'booking_payment',
                    'amount' => $booking->total_amount,
                    'currency' => $booking->currency,
                    'payment_method' => ['credit_card', 'debit_card', 'knet'][rand(0, 2)],
                    'status' => 'completed',
                    'processed_at' => now()->subDays(rand(1, 10)),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create transaction for booking {$booking->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 transactions
        $currentCount = Transaction::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalBookings = Booking::whereDoesntHave('transactions')->take($needed)->get();
            foreach ($additionalBookings as $index => $booking) {
                try {
                    Transaction::create([
                        'transaction_id' => 'TXN' . now()->format('Ymd') . str_pad($currentCount + $index, 4, '0', STR_PAD_LEFT),
                        'transactionable_type' => Booking::class,
                        'transactionable_id' => $booking->id,
                        'type' => 'booking_payment',
                        'amount' => $booking->total_amount,
                        'currency' => $booking->currency,
                        'payment_method' => ['credit_card', 'debit_card', 'knet'][rand(0, 2)],
                        'status' => 'completed',
                        'processed_at' => now()->subDays(rand(1, 10)),
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional transaction: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} transactions (Total: " . Transaction::count() . ")");
    }

    /**
     * Create clinic earnings
     */
    private function createClinicEarnings(): void
    {
        $this->command->info('💰 Creating clinic earnings...');

        $bookings = $this->data['bookings'] ?? Booking::where('status', 'completed')->get();
        $commissionRate = 0.10; // 10%

        if ($bookings->isEmpty()) {
            $this->command->warn('⚠️ No bookings found, skipping clinic earnings creation');
            return;
        }

        $createdCount = 0;
        foreach ($bookings->take(30) as $booking) {
            try {
                $grossAmount = $booking->total_amount;
                $commissionAmount = $grossAmount * $commissionRate;
                $netAmount = $grossAmount - $commissionAmount;

                ClinicEarning::create([
                    'clinic_id' => $booking->clinic_id,
                    'booking_id' => $booking->id,
                    'gross_amount' => $grossAmount,
                    'commission_rate' => $commissionRate * 100,
                    'commission_amount' => $commissionAmount,
                    'net_amount' => $netAmount,
                    'currency' => $booking->currency,
                    'status' => ['pending', 'paid'][rand(0, 1)],
                    'paid_at' => rand(0, 1) ? now()->subDays(rand(1, 5)) : null,
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create clinic earning for booking {$booking->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 clinic earnings
        $currentCount = ClinicEarning::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalBookings = Booking::whereDoesntHave('clinicEarnings')->take($needed)->get();
            foreach ($additionalBookings as $booking) {
                try {
                    $grossAmount = $booking->total_amount;
                    $commissionAmount = $grossAmount * $commissionRate;
                    $netAmount = $grossAmount - $commissionAmount;

                    ClinicEarning::create([
                        'clinic_id' => $booking->clinic_id,
                        'booking_id' => $booking->id,
                        'gross_amount' => $grossAmount,
                        'commission_rate' => $commissionRate * 100,
                        'commission_amount' => $commissionAmount,
                        'net_amount' => $netAmount,
                        'currency' => $booking->currency,
                        'status' => 'pending',
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional clinic earning: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} clinic earnings (Total: " . ClinicEarning::count() . ")");
    }

    /**
     * Create clinic payouts
     */
    private function createClinicPayouts(): void
    {
        $this->command->info('💸 Creating clinic payouts...');

        $clinics = $this->data['clinics'] ?? Clinic::all();
        $earnings = ClinicEarning::where('status', 'paid')->get()->groupBy('clinic_id');

        if ($clinics->isEmpty()) {
            $this->command->warn('⚠️ No clinics found, skipping clinic payouts creation');
            return;
        }

        $createdCount = 0;
        foreach ($clinics->take(30) as $index => $clinic) {
            try {
                $clinicEarnings = $earnings->get($clinic->id, collect());

                if ($clinicEarnings->isNotEmpty()) {
                    $totalAmount = $clinicEarnings->sum('net_amount');
                    $commissionDeducted = $clinicEarnings->sum('commission_amount');
                } else {
                    // Create payout even without earnings for testing
                    $totalAmount = rand(100, 1000);
                    $commissionDeducted = $totalAmount * 0.10;
                }

                ClinicPayout::create([
                    'clinic_id' => $clinic->id,
                    'payout_reference' => 'PAY' . now()->format('Ymd') . str_pad($index, 4, '0', STR_PAD_LEFT),
                    'total_amount' => $totalAmount,
                    'commission_deducted' => $commissionDeducted,
                    'net_amount' => $totalAmount - $commissionDeducted,
                    'currency' => 'KWD',
                    'status' => ['pending', 'approved'][rand(0, 1)],
                    'frequency' => 'monthly',
                    'payout_date' => now()->subDays(rand(1, 10)),
                    'processed_at' => rand(0, 1) ? now()->subDays(rand(1, 5)) : null,
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create clinic payout for clinic {$clinic->id}: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 clinic payouts
        $currentCount = ClinicPayout::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalClinics = Clinic::whereDoesntHave('payouts')->take($needed)->get();
            foreach ($additionalClinics as $index => $clinic) {
                try {
                    ClinicPayout::create([
                        'clinic_id' => $clinic->id,
                        'payout_reference' => 'PAY' . now()->format('Ymd') . str_pad($currentCount + $index, 4, '0', STR_PAD_LEFT),
                        'total_amount' => rand(100, 1000),
                        'commission_deducted' => rand(10, 100),
                        'net_amount' => rand(90, 900),
                        'currency' => 'KWD',
                        'status' => 'pending',
                        'frequency' => 'monthly',
                        'payout_date' => now()->subDays(rand(1, 10)),
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional clinic payout: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} clinic payouts (Total: " . ClinicPayout::count() . ")");
    }


    /**
     * Create notifications
     */
    private function createNotifications(): void
    {
        $this->command->info('🔔 Creating notifications...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();
        $bookings = $this->data['bookings'] ?? Booking::all();
        $broadcasts = Broadcast::all();

        $notificationTypes = [
            [
                'title_en' => 'Booking Confirmed',
                'title_ar' => 'تم تأكيد الحجز',
                'message_en' => 'Your booking has been confirmed.',
                'message_ar' => 'تم تأكيد حجزك.',
                'type' => 'booking_confirmed',
            ],
            [
                'title_en' => 'Booking Reminder',
                'title_ar' => 'تذكير بالحجز',
                'message_en' => 'You have a booking tomorrow.',
                'message_ar' => 'لديك حجز غداً.',
                'type' => 'booking_reminder',
            ],
            [
                'title_en' => 'Payment Received',
                'title_ar' => 'تم استلام الدفع',
                'message_en' => 'Your payment has been received.',
                'message_ar' => 'تم استلام دفعتك.',
                'type' => 'payment_received',
            ],
            [
                'title_en' => 'New Review',
                'title_ar' => 'مراجعة جديدة',
                'message_en' => 'You have received a new review.',
                'message_ar' => 'لقد تلقيت مراجعة جديدة.',
                'type' => 'new_review',
            ],
        ];

        $createdCount = 0;

        // Create notifications for users (at least 20)
        foreach ($users->take(30) as $user) {
            try {
                $notificationType = $notificationTypes[array_rand($notificationTypes)];

                Notification::create([
                    'title_en' => $notificationType['title_en'],
                    'title_ar' => $notificationType['title_ar'],
                    'description_en' => $notificationType['message_en'],
                    'description_ar' => $notificationType['message_ar'],
                    'recipient_type' => 'users',
                    'recipient_id' => $user->id,
                    'type' => $notificationType['type'],
                    'is_read' => rand(0, 1) === 1,
                    'status' => rand(0, 1) === 1 ? 'read' : 'unread',
                    'delivery_method' => 'push',
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create notification for user {$user->id}: " . $e->getMessage());
            }
        }

        // Create notifications for vendors
        $vendors = $this->data['vendors'] ?? User::whereHas('ownedClinics')->orWhereHas('roles', function ($q) {
            $q->where('name', 'clinic');
        })->get();
        foreach ($vendors->take(20) as $vendor) {
            try {
                Notification::create([
                    'title_en' => 'New Booking',
                    'title_ar' => 'حجز جديد',
                    'description_en' => 'You have received a new booking. A new booking has been made for your clinic.',
                    'description_ar' => 'لقد تلقيت حجزاً جديداً. تم إجراء حجز جديد لعيادتك.',
                    'recipient_type' => 'clinics',
                    'recipient_id' => $vendor->id,
                    'type' => 'new_booking',
                    'is_read' => rand(0, 1) === 1,
                    'status' => rand(0, 1) === 1 ? 'read' : 'unread',
                    'delivery_method' => 'push',
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create notification for vendor {$vendor->id}: " . $e->getMessage());
            }
        }

        // Link some notifications to broadcasts
        if ($broadcasts->isNotEmpty()) {
            foreach ($users->take(10) as $user) {
                try {
                    $broadcast = $broadcasts->random();
                    Notification::create([
                        'title_en' => $broadcast->title_en,
                        'title_ar' => $broadcast->title_ar,
                        'description_en' => $broadcast->description_en,
                        'description_ar' => $broadcast->description_ar,
                        'recipient_type' => 'users',
                        'recipient_id' => $user->id,
                        'type' => 'broadcast',
                        'broadcast_id' => $broadcast->id,
                        'is_read' => false,
                        'status' => 'unread',
                        'delivery_method' => 'push',
                    ]);
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create broadcast notification: " . $e->getMessage());
                }
            }
        }

        // Ensure we have at least 20 notifications
        $currentCount = Notification::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalUsers = $users->take($needed);
            foreach ($additionalUsers as $user) {
                try {
                    $notificationType = $notificationTypes[array_rand($notificationTypes)];
                    Notification::create([
                        'title_en' => $notificationType['title_en'],
                        'title_ar' => $notificationType['title_ar'],
                        'description_en' => $notificationType['message_en'],
                        'description_ar' => $notificationType['message_ar'],
                        'recipient_type' => 'users',
                        'recipient_id' => $user->id,
                        'type' => $notificationType['type'],
                        'is_read' => false,
                        'status' => 'unread',
                        'delivery_method' => 'push',
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional notification: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} notifications (Total: " . Notification::count() . ")");
    }

    /**
     * Create OTPs
     */
    private function createOtps(): void
    {
        $this->command->info('🔐 Creating OTPs...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();

        if ($users->isEmpty()) {
            $this->command->warn('⚠️ No users found, skipping OTPs creation');
            return;
        }

        $createdCount = 0;

        // Create some valid OTPs (at least 20) - only for users with phone numbers
        $usersWithPhone = $users->whereNotNull('phone');
        foreach ($usersWithPhone->take(30) as $user) {
            try {
                Otp::create([
                    'phone' => $user->phone,
                    'otp' => str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT),
                    'expires_at' => now()->addMinutes(10),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create OTP for user {$user->id}: " . $e->getMessage());
            }
        }

        // Create some expired OTPs (for testing cleanup) - only for users with phone numbers
        foreach ($usersWithPhone->take(10) as $user) {
            try {
                Otp::create([
                    'phone' => $user->phone,
                    'otp' => str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT),
                    'expires_at' => now()->subHours(2),
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $this->command->error("Failed to create expired OTP: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 OTPs
        $currentCount = Otp::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalUsers = $usersWithPhone->take($needed);
            foreach ($additionalUsers as $user) {
                try {
                    Otp::create([
                        'phone' => $user->phone,
                        'otp' => str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT),
                        'expires_at' => now()->addMinutes(10),
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional OTP: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} OTPs (Total: " . Otp::count() . ")");
    }

    /**
     * Create password reset tokens
     */
    private function createPasswordResetTokens(): void
    {
        $this->command->info('🔑 Creating password reset tokens...');

        $users = $this->data['regularUsers'] ?? User::role('user')->get();

        if ($users->isEmpty()) {
            $this->command->warn('⚠️ No users found, skipping password reset tokens creation');
            return;
        }

        $createdCount = 0;

        // Create some valid tokens (at least 20)
        foreach ($users->take(30) as $user) {
            try {
                if ($user->email) {
                    PasswordResetToken::create([
                        'id' => 'email_' . Str::random(20),
                        'email' => $user->email,
                        'token' => Str::random(64),
                        'expires_at' => now()->addHours(1),
                    ]);
                    $createdCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create password reset token for user {$user->id}: " . $e->getMessage());
            }
        }

        // Create some tokens by phone
        foreach ($users->take(20) as $user) {
            try {
                if ($user->phone) {
                    PasswordResetToken::create([
                        'id' => 'phone_' . Str::random(20),
                        'phone' => $user->phone,
                        'token' => Str::random(64),
                        'expires_at' => now()->addHours(1),
                    ]);
                    $createdCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create phone password reset token: " . $e->getMessage());
            }
        }

        // Create some expired tokens (for testing cleanup)
        foreach ($users->take(10) as $user) {
            try {
                if ($user->email) {
                    PasswordResetToken::create([
                        'id' => 'expired_' . Str::random(20),
                        'email' => $user->email,
                        'token' => Str::random(64),
                        'expires_at' => now()->subHours(2),
                    ]);
                    $createdCount++;
                }
            } catch (\Exception $e) {
                $this->command->error("Failed to create expired password reset token: " . $e->getMessage());
            }
        }

        // Ensure we have at least 20 password reset tokens
        $currentCount = PasswordResetToken::count();
        if ($currentCount < 20) {
            $needed = 20 - $currentCount;
            $additionalUsers = $users->whereNotNull('email')->take($needed)->get();
            foreach ($additionalUsers as $user) {
                try {
                    PasswordResetToken::create([
                        'id' => 'email_' . Str::random(20),
                        'email' => $user->email,
                        'token' => Str::random(64),
                        'expires_at' => now()->addHours(1),
                    ]);
                    $currentCount++;
                    $createdCount++;
                } catch (\Exception $e) {
                    $this->command->error("Failed to create additional password reset token: " . $e->getMessage());
                }
            }
        }

        $this->command->info("   ✅ Created {$createdCount} password reset tokens (Total: " . PasswordResetToken::count() . ")");
    }

    /**
     * Cleanup expired tokens
     */
    private function cleanupExpiredTokens(): void
    {
        $this->command->info('🧹 Cleaning up expired tokens...');

        $deletedOtps = Otp::where('expires_at', '<', now())->delete();
        $deletedTokens = PasswordResetToken::where('expires_at', '<', now())->delete();

        if ($deletedOtps > 0 || $deletedTokens > 0) {
            $this->command->info("   Deleted {$deletedOtps} expired OTPs and {$deletedTokens} expired password reset tokens.");
        }
    }

    /**
     * Display seeding summary
     */
    private function displaySummary(): void
    {
        $this->command->newLine();
        $this->command->info('📊 Seeding Summary:');
        $this->command->table(
            ['Model', 'Count'],
            [
                ['Users', User::count()],
                ['Roles', Role::count()],
                ['Clinics', Clinic::count()],
                ['Clinic Users', ClinicUser::count()],
                ['Clinic Operating Hours', ClinicOperatingHour::count()],
                ['Clinic Subscriptions', ClinicSubscription::count()],
                ['Clinic Earnings', ClinicEarning::count()],
                ['Clinic Payouts', ClinicPayout::count()],
                ['Categories', Category::count()],
                ['Treatments', Treatment::count()],
                ['Treatment Slots', TreatmentSlot::count()],
                ['Machines', Machine::count()],
                ['Bookings', Booking::count()],
                ['Booking Sessions', BookingSession::count()],
                ['Booking Documents', BookingDocument::count()],
                ['Governorates', Governorate::count()],
                ['Areas', Area::count()],
                ['Addresses', Address::count()],
                ['Reviews', 0], // Review model not yet implemented
                ['Favorites', Favorite::count()],
                ['Media', Media::count()],
                ['Transactions', Transaction::count()],
                ['Notifications', Notification::count()],
                ['Broadcasts', Broadcast::count()],
                ['Device Tokens', DeviceToken::count()],
                ['OTPs', Otp::count()],
                ['Password Reset Tokens', PasswordResetToken::count()],
                ['Subscription Packages', SubscriptionPackage::count()],
                ['Payment Methods', PaymentMethod::count()],
                ['Site Settings', SiteSetting::count()],
                ['FAQs', Faq::count()],
                ['Banners', Banner::count()],
            ]
        );
    }
}
