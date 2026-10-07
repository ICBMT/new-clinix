<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Permission groups matching sidebar tab groups structure
     * Only includes permissions actually used in the application
     */
    private static $permissionGroups = [
        // Tab group Platform
        'Platform' => [
            'dashboard.view',
            'dashboard.new-registrations',
            'dashboard.highlights',
            'dashboard.user-activity',
            'dashboard.bookings-overview',
            'dashboard.recent-activities',
            'dashboard.system-performance',
        ],
        // Tab group User Management
        'User Management' => [
            // Users Management
            'users.view',
            'users.create',
            'users.show',
            'users.edit',
            'users.destroy',
             'users.toggle-status',
            'users.view-profile',
            'users.edit-profile',
            'users.view-medical',
            'users.edit-medical',
            'users.view-bookings',
            'users.view-favorites',
            'users.view-medical-records',
            'users.view-transactions',
            'users.view-activity',
            // Profile Management
            'profile.edit',
            'profile.destroy',
            // Role Management
            'roles.view',
            'roles.create',
            'roles.show',
            'roles.edit',
            'roles.destroy',
            // Admin Management
            'admins.view',
            'admins.create',
            'admins.show',
            'admins.edit',
            'admins.destroy',
            'admins.toggle-status',
            // Activity Logs
            'activity-logs.view',
            'activity-logs.show',
            'activity-logs.destroy',
        ],
        // Tab group Clinic Management
        'Clinic Management' => [
            // Clinics Management
            'clinics.view',
            'clinics.create',
            'clinics.show',
            'clinics.edit',
            'clinics.destroy',
            'clinics.approve',
            'clinics.reject',
            'clinics.toggle-featured',
            'clinics.toggle-auto-confirm',
            'clinics.toggle-owner-status',
            'clinics.update-office-hours',
            'clinics.update-users',
            'clinics.view-profile',
            'clinics.edit-profile',
            'clinics.edit-address',
            'clinics.edit-operating-hours',
            'clinics.edit-subscriptions',
            // 'clinics.view-payouts', // COMMENTED OUT - using earnings only
            'clinics.edit-staff',
            // Clinics Address Management
            'clinics-address.view',
            'clinics-address.show',
            'clinics-address.edit',
            // Clinics Operating Hours Management
            'clinics-operating-hours.view',
            'clinics-operating-hours.show',
            'clinics-operating-hours.edit',
            // Clinics Subscriptions Management
            'clinics-subscriptions.view',
            'clinics-subscriptions.show',
            'clinics-subscriptions.edit',
            'clinics-subscriptions.toggle-status',
            // Bookings Management (unified)
            'bookings.view',
            'bookings.create',
            'bookings.show',
            'bookings.edit',
            'bookings.destroy',
            'bookings.accept',
            'bookings.reject',
            'bookings.complete',
            'bookings.cancel',
            'bookings.reschedule',
            // Legacy bookings permissions (for backward compatibility)
            'clinics-bookings.view',
            'clinics-bookings.show',
            'clinics-bookings.edit',
            'clinics-bookings.reschedule',
            'clinics-bookings.cancel',
            'clinics-bookings.complete',
            'clinics-bookings.accept',
            'clinics-bookings.reject',
            // Payouts Management (unified) - COMMENTED OUT
            // 'payouts.view',
            // 'payouts.create',
            // 'payouts.show',
            // 'payouts.edit',
            // 'payouts.destroy',
            // 'payouts.generate',
            // 'payouts.process',
            // 'payouts.mark-completed',
            // 'payouts.mark-failed',
            // 'payouts.export',
            // Legacy payouts permissions (for backward compatibility) - COMMENTED OUT
            // 'clinics-payouts.view',
            // 'clinics-payouts.show',
            // 'clinics-payouts.process',
            // 'clinics-payouts.complete',
            // 'clinics-payouts.fail',
            // Earnings Management
            'earnings.view',
            'earnings.show',
            'earnings.process',
            // Clinics Staff Management
            'clinics-staff.view',
            'clinics-staff.create',
            'clinics-staff.show',
            'clinics-staff.edit',
            'clinics-staff.destroy',
            // Categories Management
            'categories.view',
            'categories.create',
            'categories.show',
            'categories.edit',
            'categories.destroy',
            'categories.toggle-status',
            // Treatments Management
            'treatments.view',
            'treatments.create',
            'treatments.show',
            'treatments.edit',
            'treatments.destroy',
            'treatments.toggle-status',
            'treatments.toggle-featured',
            'treatments.toggle-fast-booking',
            'treatments.approve',
            'treatments.reject',
            // Treatment Slots Management
            'treatment-slots.view',
            'treatment-slots.create',
            'treatment-slots.show',
            'treatment-slots.edit',
            'treatment-slots.destroy',
            // Machines Management
            'machines.view',
            'machines.create',
            'machines.show',
            'machines.edit',
            'machines.destroy',
            'machines.toggle-status',
            'machines.approve',
            'machines.reject',
            // Reviews Management
            'reviews.view',
            'reviews.create',
            'reviews.show',
            'reviews.edit',
            'reviews.destroy',
            'reviews.toggle-status',
            'reviews.approve',
            'reviews.reject',
        ],
        // Tab group Location Management
        'Location Management' => [
            // Governorates Management
            'governorates.view',
            'governorates.create',
            'governorates.show',
            'governorates.edit',
            'governorates.destroy',
            'governorates.toggle-status',
            // Areas Management
            'areas.view',
            'areas.create',
            'areas.show',
            'areas.edit',
            'areas.destroy',
            'areas.toggle-status',
        ],
        // Tab group Promotion Management
        'Promotion Management' => [
            // Banners Management
            'banners.view',
            'banners.create',
            'banners.show',
            'banners.edit',
            'banners.destroy',
             'banners.toggle-status',
        ],
        // Tab group Support & Contact Management
        'Support & Contact Management' => [
            // FAQs Management
            'faqs.view',
            'faqs.create',
            'faqs.show',
            'faqs.edit',
            'faqs.destroy',
             'faqs.toggle-status',
        ],
        // Tab group Finance Management
        'Finance Management' => [
            // Payment Methods Management
            'payment-methods.view',
            'payment-methods.create',
            'payment-methods.show',
            'payment-methods.edit',
            'payment-methods.destroy',
            'payment-methods.toggle-status',
            // Subscription Packages Management
            'subscription-packages.view',
            'subscription-packages.create',
            'subscription-packages.show',
            'subscription-packages.edit',
            'subscription-packages.destroy',
            'subscription-packages.toggle-status',
            'subscription-packages.toggle-featured',
            // Clinic Subscriptions Management
            'clinics-subscriptions.view',
            'clinics-subscriptions.create',
            'clinics-subscriptions.show',
            'clinics-subscriptions.edit',
            'clinics-subscriptions.destroy',
            'clinics-subscriptions.toggle-status',
            // Earnings Management
            'earnings.view',
            'earnings.show',
            'earnings.process',
        ],
        // Tab group Notifications Management
        'Notifications Management' => [
            // Notifications Management
            'notifications.view',
            'notifications.create',
            'notifications.show',
            'notifications.edit',
            'notifications.destroy',
            'notifications.mark-read',
            'notifications.mark-all-read',
            'notifications.activate',
            'notifications.deactivate',
            // Broadcast Management
            'broadcasts.view',
            'broadcasts.create',
            'broadcasts.show',
            'broadcasts.edit',
            'broadcasts.destroy',
            'broadcasts.send',
            'broadcasts.activate',
            'broadcasts.deactivate',
        ],
        // Tab group Site Settings
        'Site Settings' => [
            // Site Settings
            'site-settings.general.view',
            'site-settings.general.edit',
            'site-settings.vendor.view',
            'site-settings.vendor.edit',
            'site-settings.contact.view',
            'site-settings.contact.edit',
            'site-settings.terms.view',
            'site-settings.terms.edit',
            'site-settings.privacy.view',
            'site-settings.privacy.edit',
            'site-settings.communication.view',
            'site-settings.communication.edit',
            'site-settings.myfatoorah.view',
            'site-settings.myfatoorah.edit',
            'site-settings.support.view',
            'site-settings.support.edit',
            'site-settings.firebase.view',
            'site-settings.firebase.edit',
            'site-settings.booking.view',
            'site-settings.booking.edit',
        ],
    ];

    /**
     * System roles that cannot be deleted or modified by admins
     */
    private static $systemRoles = [
        'super-admin' => 'Super Admin',
        'user' => 'User',
        'clinic' => 'Clinic',
        'clinic_manager' => 'Clinic Manager',
        'guest' => 'Guest',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Flatten all permissions
        $allPermissions = [];
        foreach (self::$permissionGroups as $group => $permissions) {
            $allPermissions = array_merge($allPermissions, $permissions);
        }

        // Remove duplicates
        $allPermissions = array_unique($allPermissions);

        // Create permissions
        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $this->command->info('Created ' . count($allPermissions) . ' unique permissions.');

        // Create roles and assign permissions
        $this->createRolesAndAssignPermissions();

        $this->command->info('✅ Permission and Role seeder completed successfully!');
    }

    /**
     * Create roles and assign permissions
     */
    private function createRolesAndAssignPermissions(): void
    {
        // Get all permissions
        $allPermissions = Permission::all();

        // Create system roles first
        foreach (self::$systemRoles as $roleName => $roleAlias) {
            Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ], [
                'alias' => $roleAlias,
            ]);
        }

        // 1. Super Admin - ALL permissions except payouts (only earnings)
        $superAdminRole = Role::where('name', 'super-admin')->first();
        $superAdminPermissions = $allPermissions->filter(function ($permission) {
            // Exclude all payout permissions, keep only earnings
            $excludedPatterns = [
                'clinics.view-payouts',
                'payouts.view',
                'payouts.create',
                'payouts.show',
                'payouts.edit',
                'payouts.generate',
                'payouts.process',
                'payouts.destroy',
                'payouts.mark-completed',
                'payouts.mark-failed',
                'payouts.export',
                'clinics-payouts.view',
                'clinics-payouts.show',
                'clinics-payouts.process',
                'clinics-payouts.complete',
                'clinics-payouts.fail',
            ];
            return !in_array($permission->name, $excludedPatterns);
        });
        $superAdminRole->syncPermissions($superAdminPermissions);
        $this->command->info('✅ Super Admin role: ' . $superAdminPermissions->count() . ' permissions (payouts excluded, earnings only)');

        // 2. Clinic - Clinic owner permissions (dashboard + clinic management, read-only for most operations)
        $clinicRole = Role::where('name', 'clinic')->first();
        $clinicPermissions = $allPermissions->filter(function ($permission) {
            // Dashboard permissions + clinic management related permissions + notifications + profile
            $hasPrefix = str_starts_with($permission->name, 'dashboard.') ||
                str_starts_with($permission->name, 'clinics.') ||
                str_starts_with($permission->name, 'clinics-address.') ||
                str_starts_with($permission->name, 'clinics-operating-hours.') ||
                str_starts_with($permission->name, 'clinics-subscriptions.') ||
                str_starts_with($permission->name, 'bookings.') ||
                str_starts_with($permission->name, 'clinics-bookings.') ||
                str_starts_with($permission->name, 'earnings.') ||
                str_starts_with($permission->name, 'treatments.') ||
                str_starts_with($permission->name, 'treatment-slots.') ||
                str_starts_with($permission->name, 'machines.') ||
                str_starts_with($permission->name, 'reviews.') ||
                str_starts_with($permission->name, 'clinics-staff.') ||
                str_starts_with($permission->name, 'notifications.') ||
                str_starts_with($permission->name, 'profile.');
            
            if (!$hasPrefix) {
                return false;
            }
            
            // Exclude payouts completely for clinic role
            // Allow create, edit, view, delete for: clinics, bookings, treatments, treatment-slots, machines, reviews, categories
            // Earnings: Only view and show (exclude process)
            // Notifications: Allow view, show, destroy, mark-read, mark-all-read (for their own notifications only)
            // Note: clinics.approve and clinics.reject are now allowed for clinic role
            // Note: clinics.toggle-featured and clinics.toggle-auto-confirm are allowed (but only for their own clinics - checked in gate)
            // IMPORTANT: clinic role can create and edit their own clinics, treatments, machines, and clinic staff
            // All operations are restricted to their own clinics only (enforced in controllers/gates)
            $excludedPatterns = [
                // Clinics: Allow create, edit, view (exclude destroy, approve/reject/toggle-owner-status)
                // clinics.create and clinics.edit are NOT excluded - clinic role can create and edit their own clinics
                'users.toggle-status',
                'clinics.destroy',
                'clinics.approve',
                'clinics.reject',
                'clinics.toggle-owner-status',
                // Treatments: Allow create, edit, view (for their own clinics only - enforced in controller)
                // treatments.create and treatments.edit are NOT excluded
                // Machines: Allow create, edit, view (for their own clinics only - enforced in controller)
                // machines.create and machines.edit are NOT excluded
                // Clinics Staff: Allow create, edit, view (for their own clinics only - enforced in controller)
                // clinics-staff.create and clinics-staff.edit are NOT excluded
                // Payouts: Exclude all payout permissions
                'clinics.view-payouts',
                'payouts.view',
                'payouts.create',
                'payouts.show',
                'payouts.edit',
                'payouts.generate',
                'payouts.process',
                'payouts.destroy',
                'payouts.mark-completed',
                'payouts.mark-failed',
                'payouts.export',
                'clinics-payouts.view',
                'clinics-payouts.show',
                'clinics-payouts.process',
                'clinics-payouts.complete',
                'clinics-payouts.fail',
                // Earnings: Exclude process permission (only allow view and show)
                'earnings.process',
                // Broadcasts: Exclude view permission for clinic role
                'broadcasts.view',
                // Notifications: Exclude create, edit, activate, deactivate (only allow view, show, destroy, mark-read, mark-all-read)
                'notifications.create',
                'notifications.edit',
                'notifications.activate',
                'notifications.deactivate',
            ];
            
            return !in_array($permission->name, $excludedPatterns);
        });
        $clinicRole->syncPermissions($clinicPermissions);
        $this->command->info('✅ Clinic role: ' . $clinicPermissions->count() . ' permissions');

        // 3. Clinic Manager - Similar permissions but includes staff management (can create/edit staff)
        $clinicManagerRole = Role::where('name', 'clinic_manager')->first();
        $clinicManagerPermissions = $allPermissions->filter(function ($permission) {
            // Dashboard permissions + clinic management related permissions + staff management + notifications + profile
            $hasPrefix = str_starts_with($permission->name, 'dashboard.') ||
                str_starts_with($permission->name, 'clinics.') ||
                str_starts_with($permission->name, 'clinics-address.') ||
                str_starts_with($permission->name, 'clinics-operating-hours.') ||
                str_starts_with($permission->name, 'clinics-subscriptions.') ||
                str_starts_with($permission->name, 'clinics-staff.') ||
                str_starts_with($permission->name, 'bookings.') ||
                str_starts_with($permission->name, 'clinics-bookings.') ||
                str_starts_with($permission->name, 'earnings.') ||
                str_starts_with($permission->name, 'treatments.') ||
                str_starts_with($permission->name, 'treatment-slots.') ||
                str_starts_with($permission->name, 'machines.') ||
                str_starts_with($permission->name, 'reviews.') ||
                str_starts_with($permission->name, 'notifications.') ||
                str_starts_with($permission->name, 'profile.');
            
            if (!$hasPrefix) {
                return false;
            }
            
            // Exclude payouts completely for clinic_manager role
            // Allow create, edit, view, delete for: clinics, bookings, treatments, treatment-slots, machines, reviews, categories
            // Earnings: Only view and show (exclude process)
            // Notifications: Allow view, show, destroy, mark-read, mark-all-read (for their own notifications only)
            // Note: clinics.toggle-featured and clinics.toggle-auto-confirm are allowed (but only for their own clinics - checked in gate)
            // IMPORTANT: clinic_manager role can create and edit their own clinics, treatments, machines, and clinic staff
            // All operations are restricted to their own clinics only (enforced in controllers/gates)
            $excludedPatterns = [
                // Clinics: Allow create, edit, view (exclude destroy, approve/reject/toggle-owner-status)
                // clinics.create and clinics.edit are NOT excluded - clinic_manager can create and edit their own clinics
                'clinics.destroy',
                'clinics.approve',
                'clinics.reject',
                'clinics.toggle-owner-status',
                // Treatments: Allow create, edit, view (for their own clinics only - enforced in controller)
                // treatments.create and treatments.edit are NOT excluded
                // Machines: Allow create, edit, view (for their own clinics only - enforced in controller)
                // machines.create and machines.edit are NOT excluded
                // Clinics Staff: Allow create, edit, view (for their own clinics only - enforced in controller)
                // clinics-staff.create and clinics-staff.edit are NOT excluded (only destroy is excluded)
                'clinics-staff.destroy',
                // Payouts: Exclude all payout permissions
                'clinics.view-payouts',
                'payouts.view',
                'payouts.create',
                'payouts.show',
                'payouts.edit',
                'payouts.generate',
                'payouts.process',
                'payouts.destroy',
                'payouts.mark-completed',
                'payouts.mark-failed',
                'payouts.export',
                'clinics-payouts.view',
                'clinics-payouts.show',
                'clinics-payouts.process',
                'clinics-payouts.complete',
                'clinics-payouts.fail',
                // Earnings: Exclude process permission (only allow view and show)
                'earnings.process',
                // Broadcasts: Exclude view permission for clinic_manager role
                'broadcasts.view',
                // Notifications: Exclude create, edit, activate, deactivate (only allow view, show, destroy, mark-read, mark-all-read)
                'notifications.create',
                'notifications.edit',
                'notifications.activate',
                'notifications.deactivate',
            ];
            
            return !in_array($permission->name, $excludedPatterns);
        });
        $clinicManagerRole->syncPermissions($clinicManagerPermissions);
        $this->command->info('✅ Clinic Manager role: ' . $clinicManagerPermissions->count() . ' permissions');

        // 4. User and Guest roles - No admin panel permissions (blocked by middleware)
        $userRole = Role::where('name', 'user')->first();
        $guestRole = Role::where('name', 'guest')->first();
        $this->command->info('✅ User and Guest roles created (no admin panel access)');

        // Create super admin user
        $this->createSuperAdminUser();
    }

    /**
     * Create super admin user
     */
    private function createSuperAdminUser(): void
    {
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email' => 'admin@example.com',
                'email_verified_at' => now(),
                'phone' => '+965' . rand(100000000, 999999999),
                'phone_verified_at' => now(),
                'status' => 'active',
            ]
        );

        if (!$superAdmin->hasRole('super-admin')) {
            $superAdmin->assignRole('super-admin');
        }

        $this->command->info('✅ Super Admin user created: admin@example.com / password');
    }

    /**
     * Get permission groups for UI display
     */
    public static function getPermissionGroups(): array
    {
        return self::$permissionGroups;
    }

    /**
     * Get system roles
     */
    public static function getSystemRoles(): array
    {
        return self::$systemRoles;
    }

    /**
     * Check if a role is a system role
     */
    public static function isSystemRole(string $roleName): bool
    {
        return array_key_exists($roleName, self::$systemRoles);
    }
}
