<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // Model policies can be added here if needed
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Super admin can access everything
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('super-admin')) {
                return true;
            }
        });

        // ============================================
        // Platform permissions
        // ============================================
        Gate::define('dashboard.view', function ($user) {
            return $user->hasPermissionTo('dashboard.view');
        });

        Gate::define('dashboard.new-registrations', function ($user) {
            return $user->hasPermissionTo('dashboard.new-registrations');
        });

        Gate::define('dashboard.highlights', function ($user) {
            return $user->hasPermissionTo('dashboard.highlights');
        });

        Gate::define('dashboard.user-activity', function ($user) {
            return $user->hasPermissionTo('dashboard.user-activity');
        });

        Gate::define('dashboard.bookings-overview', function ($user) {
            return $user->hasPermissionTo('dashboard.bookings-overview');
        });

        Gate::define('dashboard.recent-activities', function ($user) {
            return $user->hasPermissionTo('dashboard.recent-activities');
        });

        Gate::define('dashboard.system-performance', function ($user) {
            return $user->hasPermissionTo('dashboard.system-performance');
        });

        // ============================================
        // User Management permissions
        // ============================================
        // Users Management
        Gate::define('users.view', function ($user) {
            return $user->hasPermissionTo('users.view');
        });

        Gate::define('users.create', function ($user) {
            return $user->hasPermissionTo('users.create');
        });

        Gate::define('users.show', function ($user) {
            return $user->hasPermissionTo('users.show');
        });

        Gate::define('users.edit', function ($user) {
            return $user->hasPermissionTo('users.edit');
        });

        Gate::define('users.destroy', function ($user) {
            return $user->hasPermissionTo('users.destroy');
        });

        Gate::define('users.toggle-status', function ($user) {
            // Clinic managers should not be able to toggle user status (including owner status)
            if ($user->hasRole('clinic_manager') && !$user->hasRole('super-admin')) {
                return false;
            }
            return $user->hasPermissionTo('users.toggle-status');
        });

        Gate::define('users.view-profile', function ($user) {
            return $user->hasPermissionTo('users.view-profile');
        });

        Gate::define('users.edit-profile', function ($user) {
            return $user->hasPermissionTo('users.edit-profile');
        });

        Gate::define('users.view-medical', function ($user) {
            return $user->hasPermissionTo('users.view-medical');
        });

        Gate::define('users.edit-medical', function ($user) {
            return $user->hasPermissionTo('users.edit-medical');
        });

        Gate::define('users.view-bookings', function ($user) {
            return $user->hasPermissionTo('users.view-bookings');
        });

        Gate::define('users.view-favorites', function ($user) {
            return $user->hasPermissionTo('users.view-favorites');
        });

        Gate::define('users.view-medical-records', function ($user) {
            return $user->hasPermissionTo('users.view-medical-records');
        });

        Gate::define('users.view-transactions', function ($user) {
            return $user->hasPermissionTo('users.view-transactions');
        });

        Gate::define('users.view-activity', function ($user) {
            return $user->hasPermissionTo('users.view-activity');
        });

        // Profile Management
        Gate::define('profile.edit', function ($user) {
            return $user->hasPermissionTo('profile.edit');
        });

        Gate::define('profile.destroy', function ($user) {
            // Super admin cannot delete their own account
            if ($user->hasRole('super-admin')) {
                return false;
            }
            return $user->hasPermissionTo('profile.destroy');
        });

        // Role Management
        Gate::define('roles.view', function ($user) {
            return $user->hasPermissionTo('roles.view');
        });

        Gate::define('roles.create', function ($user) {
            return $user->hasPermissionTo('roles.create');
        });

        Gate::define('roles.show', function ($user) {
            return $user->hasPermissionTo('roles.show');
        });

        Gate::define('roles.edit', function ($user) {
            return $user->hasPermissionTo('roles.edit');
        });

        Gate::define('roles.destroy', function ($user) {
            return $user->hasPermissionTo('roles.destroy');
        });

        // Admin Management
        Gate::define('admins.view', function ($user) {
            return $user->hasPermissionTo('admins.view');
        });

        Gate::define('admins.create', function ($user) {
            return $user->hasPermissionTo('admins.create');
        });

        Gate::define('admins.show', function ($user) {
            return $user->hasPermissionTo('admins.show');
        });

        Gate::define('admins.edit', function ($user) {
            return $user->hasPermissionTo('admins.edit');
        });

        Gate::define('admins.destroy', function ($user) {
            return $user->hasPermissionTo('admins.destroy');
        });

        Gate::define('admins.toggle-status', function ($user) {
            return $user->hasPermissionTo('admins.toggle-status');
        });

        // Activity Logs
        Gate::define('activity-logs.view', function ($user) {
            return $user->hasPermissionTo('activity-logs.view');
        });

        Gate::define('activity-logs.show', function ($user) {
            return $user->hasPermissionTo('activity-logs.show');
        });

        Gate::define('activity-logs.destroy', function ($user) {
            return $user->hasPermissionTo('activity-logs.destroy');
        });

        // ============================================
        // Clinic Management permissions
        // ============================================
        // Clinics Management
        Gate::define('clinics.view', function ($user) {
            return $user->hasPermissionTo('clinics.view');
        });

        Gate::define('clinics.create', function ($user) {
            return $user->hasPermissionTo('clinics.create');
        });

        Gate::define('clinics.show', function ($user) {
            // Check permission for all users including clinic and clinic_manager roles
            // This allows fine-grained control via permissions
            return $user->hasPermissionTo('clinics.show');
        });

        Gate::define('clinics.edit', function ($user) {
            // Check permission for all users including clinic and clinic_manager roles
            // This allows fine-grained control via permissions
            return $user->hasPermissionTo('clinics.edit');
        });

        Gate::define('clinics.destroy', function ($user) {
            return $user->hasPermissionTo('clinics.destroy');
        });

        Gate::define('clinics.approve', function ($user) {
            return $user->hasPermissionTo('clinics.approve');
        });

        Gate::define('clinics.reject', function ($user) {
            return $user->hasPermissionTo('clinics.reject');
        });

        Gate::define('clinics.toggle-featured', function ($user) {
            // Super admin can always toggle
            if ($user->hasRole('super-admin')) {
                return true;
            }
            // Clinic and clinic_manager can toggle for their own clinics (ownership checked in controller)
            return $user->hasPermissionTo('clinics.toggle-featured');
        });

        Gate::define('clinics.toggle-auto-confirm', function ($user) {
            // Super admin can always toggle
            if ($user->hasRole('super-admin')) {
                return true;
            }
            // Clinic and clinic_manager can toggle for their own clinics (ownership checked in controller)
            return $user->hasPermissionTo('clinics.toggle-auto-confirm');
        });

        Gate::define('clinics.toggle-owner-status', function ($user) {
            // Clinic and clinic_manager roles should not be able to toggle owner status
            if (($user->hasRole('clinic') || $user->hasRole('clinic_manager')) && !$user->hasRole('super-admin')) {
                return false;
            }
            return $user->hasPermissionTo('clinics.toggle-owner-status');
        });

        Gate::define('clinics.update-office-hours', function ($user) {
            return $user->hasPermissionTo('clinics.update-office-hours');
        });

        Gate::define('clinics.update-users', function ($user) {
            return $user->hasPermissionTo('clinics.update-users');
        });

        Gate::define('clinics.view-profile', function ($user) {
            return $user->hasPermissionTo('clinics.view-profile');
        });

        Gate::define('clinics.edit-profile', function ($user) {
            return $user->hasPermissionTo('clinics.edit-profile');
        });

        Gate::define('clinics.edit-address', function ($user) {
            return $user->hasPermissionTo('clinics.edit-address');
        });

        Gate::define('clinics.edit-operating-hours', function ($user) {
            return $user->hasPermissionTo('clinics.edit-operating-hours');
        });

        Gate::define('clinics.edit-subscriptions', function ($user) {
            return $user->hasPermissionTo('clinics.edit-subscriptions');
        });

        Gate::define('clinics.view-payouts', function ($user) {
            return $user->hasPermissionTo('clinics.view-payouts');
        });

        Gate::define('clinics.edit-staff', function ($user) {
            return $user->hasPermissionTo('clinics.edit-staff');
        });

        // Clinics Address Management
        Gate::define('clinics-address.view', function ($user) {
            return $user->hasPermissionTo('clinics-address.view');
        });

        Gate::define('clinics-address.show', function ($user) {
            return $user->hasPermissionTo('clinics-address.show');
        });

        Gate::define('clinics-address.edit', function ($user) {
            return $user->hasPermissionTo('clinics-address.edit');
        });

        // Clinics Operating Hours Management
        Gate::define('clinics-operating-hours.view', function ($user) {
            return $user->hasPermissionTo('clinics-operating-hours.view');
        });

        Gate::define('clinics-operating-hours.show', function ($user) {
            return $user->hasPermissionTo('clinics-operating-hours.show');
        });

        Gate::define('clinics-operating-hours.edit', function ($user) {
            return $user->hasPermissionTo('clinics-operating-hours.edit');
        });

        // Clinics Subscriptions Management
        Gate::define('clinics-subscriptions.view', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.view');
        });

        Gate::define('clinics-subscriptions.show', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.show');
        });

        Gate::define('clinics-subscriptions.edit', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.edit');
        });

        Gate::define('clinics-subscriptions.toggle-status', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.toggle-status');
        });

        // Bookings Management (unified)
        Gate::define('bookings.view', function ($user) {
            return $user->hasPermissionTo('bookings.view');
        });

        Gate::define('bookings.create', function ($user) {
            return $user->hasPermissionTo('bookings.create');
        });

        Gate::define('bookings.show', function ($user) {
            return $user->hasPermissionTo('bookings.show');
        });

        Gate::define('bookings.edit', function ($user) {
            return $user->hasPermissionTo('bookings.edit');
        });

        Gate::define('bookings.destroy', function ($user) {
            return $user->hasPermissionTo('bookings.destroy');
        });

        Gate::define('bookings.accept', function ($user) {
            return $user->hasPermissionTo('bookings.accept');
        });

        Gate::define('bookings.reject', function ($user) {
            return $user->hasPermissionTo('bookings.reject');
        });

        Gate::define('bookings.complete', function ($user) {
            return $user->hasPermissionTo('bookings.complete');
        });

        Gate::define('bookings.cancel', function ($user) {
            return $user->hasPermissionTo('bookings.cancel');
        });

        Gate::define('bookings.reschedule', function ($user) {
            return $user->hasPermissionTo('bookings.reschedule');
        });

        // Legacy bookings permissions (for backward compatibility)
        Gate::define('clinics-bookings.view', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.view');
        });

        Gate::define('clinics-bookings.show', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.show');
        });

        Gate::define('clinics-bookings.edit', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.edit');
        });

        Gate::define('clinics-bookings.reschedule', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.reschedule');
        });

        Gate::define('clinics-bookings.cancel', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.cancel');
        });

        Gate::define('clinics-bookings.complete', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.complete');
        });

        Gate::define('clinics-bookings.accept', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.accept');
        });

        Gate::define('clinics-bookings.reject', function ($user) {
            return $user->hasPermissionTo('clinics-bookings.reject');
        });

        // Payouts Management (unified)
        Gate::define('payouts.view', function ($user) {
            return $user->hasPermissionTo('payouts.view');
        });

        Gate::define('payouts.create', function ($user) {
            return $user->hasPermissionTo('payouts.create');
        });

        Gate::define('payouts.show', function ($user) {
            return $user->hasPermissionTo('payouts.show');
        });

        Gate::define('payouts.edit', function ($user) {
            return $user->hasPermissionTo('payouts.edit');
        });

        Gate::define('payouts.destroy', function ($user) {
            return $user->hasPermissionTo('payouts.destroy');
        });

        Gate::define('payouts.generate', function ($user) {
            return $user->hasPermissionTo('payouts.generate');
        });

        Gate::define('payouts.process', function ($user) {
            return $user->hasPermissionTo('payouts.process');
        });

        Gate::define('payouts.mark-completed', function ($user) {
            return $user->hasPermissionTo('payouts.mark-completed');
        });

        Gate::define('payouts.mark-failed', function ($user) {
            return $user->hasPermissionTo('payouts.mark-failed');
        });

        Gate::define('payouts.export', function ($user) {
            return $user->hasPermissionTo('payouts.export');
        });

        // Legacy payouts permissions (for backward compatibility)
        Gate::define('clinics-payouts.view', function ($user) {
            return $user->hasPermissionTo('clinics-payouts.view');
        });

        Gate::define('clinics-payouts.show', function ($user) {
            return $user->hasPermissionTo('clinics-payouts.show');
        });

        Gate::define('clinics-payouts.process', function ($user) {
            return $user->hasPermissionTo('clinics-payouts.process');
        });

        Gate::define('clinics-payouts.complete', function ($user) {
            return $user->hasPermissionTo('clinics-payouts.complete');
        });

        Gate::define('clinics-payouts.fail', function ($user) {
            return $user->hasPermissionTo('clinics-payouts.fail');
        });

        // Earnings Management
        Gate::define('earnings.view', function ($user) {
            return $user->hasPermissionTo('earnings.view');
        });

        Gate::define('earnings.show', function ($user) {
            return $user->hasPermissionTo('earnings.show');
        });

        Gate::define('earnings.process', function ($user) {
            return $user->hasPermissionTo('earnings.process');
        });

        // Clinics Staff Management
        Gate::define('clinics-staff.view', function ($user) {
            return $user->hasPermissionTo('clinics-staff.view');
        });

        Gate::define('clinics-staff.create', function ($user) {
            return $user->hasPermissionTo('clinics-staff.create');
        });

        Gate::define('clinics-staff.show', function ($user) {
            return $user->hasPermissionTo('clinics-staff.show');
        });

        Gate::define('clinics-staff.edit', function ($user) {
            return $user->hasPermissionTo('clinics-staff.edit');
        });

        Gate::define('clinics-staff.destroy', function ($user) {
            return $user->hasPermissionTo('clinics-staff.destroy');
        });

        // Categories Management
        Gate::define('categories.view', function ($user) {
            return $user->hasPermissionTo('categories.view');
        });

        Gate::define('categories.create', function ($user) {
            // Allow clinic owners and managers to create categories
            if ($user->hasRole(['clinic', 'clinic_manager']) && $user->hasPermissionTo('categories.create')) {
                return true;
            }
            return $user->hasPermissionTo('categories.create');
        });

        Gate::define('categories.show', function ($user) {
            return $user->hasPermissionTo('categories.show');
        });

        Gate::define('categories.edit', function ($user) {
            return $user->hasPermissionTo('categories.edit');
        });

        Gate::define('categories.destroy', function ($user) {
            return $user->hasPermissionTo('categories.destroy');
        });

        Gate::define('categories.toggle-status', function ($user) {
            return $user->hasPermissionTo('categories.toggle-status');
        });

        // Treatments Management
        Gate::define('treatments.view', function ($user) {
            return $user->hasPermissionTo('treatments.view');
        });

        Gate::define('treatments.create', function ($user) {
            // Check permission for all users including clinic and clinic_manager roles
            // This allows fine-grained control via permissions
            return $user->hasPermissionTo('treatments.create');
        });

        Gate::define('treatments.show', function ($user) {
            return $user->hasPermissionTo('treatments.show');
        });

        Gate::define('treatments.edit', function ($user) {
            return $user->hasPermissionTo('treatments.edit');
        });

        Gate::define('treatments.destroy', function ($user) {
            return $user->hasPermissionTo('treatments.destroy');
        });

        Gate::define('treatments.toggle-status', function ($user) {
            return $user->hasPermissionTo('treatments.toggle-status');
        });

        Gate::define('treatments.toggle-featured', function ($user) {
            return $user->hasPermissionTo('treatments.toggle-featured');
        });

        Gate::define('treatments.toggle-fast-booking', function ($user) {
            return $user->hasPermissionTo('treatments.toggle-fast-booking');
        });

        Gate::define('treatments.approve', function ($user) {
            return $user->hasPermissionTo('treatments.approve');
        });

        Gate::define('treatments.reject', function ($user) {
            return $user->hasPermissionTo('treatments.reject');
        });

        // Treatment Slots Management
        Gate::define('treatment-slots.view', function ($user) {
            return $user->hasPermissionTo('treatment-slots.view');
        });

        Gate::define('treatment-slots.create', function ($user) {
            return $user->hasPermissionTo('treatment-slots.create');
        });

        Gate::define('treatment-slots.show', function ($user) {
            return $user->hasPermissionTo('treatment-slots.show');
        });

        Gate::define('treatment-slots.edit', function ($user) {
            return $user->hasPermissionTo('treatment-slots.edit');
        });

        Gate::define('treatment-slots.destroy', function ($user) {
            return $user->hasPermissionTo('treatment-slots.destroy');
        });

        // Machines Management
        Gate::define('machines.view', function ($user) {
            return $user->hasPermissionTo('machines.view');
        });

        Gate::define('machines.create', function ($user) {
            return $user->hasPermissionTo('machines.create');
        });

        Gate::define('machines.show', function ($user) {
            return $user->hasPermissionTo('machines.show');
        });

        Gate::define('machines.edit', function ($user) {
            return $user->hasPermissionTo('machines.edit');
        });

        Gate::define('machines.destroy', function ($user) {
            return $user->hasPermissionTo('machines.destroy');
        });

        Gate::define('machines.toggle-status', function ($user) {
            return $user->hasPermissionTo('machines.toggle-status');
        });

        Gate::define('machines.approve', function ($user) {
            return $user->hasPermissionTo('machines.approve');
        });

        Gate::define('machines.reject', function ($user) {
            return $user->hasPermissionTo('machines.reject');
        });

        // Reviews Management
        Gate::define('reviews.view', function ($user) {
            return $user->hasPermissionTo('reviews.view');
        });

        Gate::define('reviews.create', function ($user) {
            return $user->hasPermissionTo('reviews.create');
        });

        Gate::define('reviews.show', function ($user) {
            return $user->hasPermissionTo('reviews.show');
        });

        Gate::define('reviews.edit', function ($user) {
            return $user->hasPermissionTo('reviews.edit');
        });

        Gate::define('reviews.destroy', function ($user) {
            return $user->hasPermissionTo('reviews.destroy');
        });

        Gate::define('reviews.toggle-status', function ($user) {
            return $user->hasPermissionTo('reviews.toggle-status');
        });

        Gate::define('reviews.approve', function ($user) {
            return $user->hasPermissionTo('reviews.approve');
        });

        Gate::define('reviews.reject', function ($user) {
            return $user->hasPermissionTo('reviews.reject');
        });

        // ============================================
        // Location Management permissions
        // ============================================
        // Governorates Management
        Gate::define('governorates.view', function ($user) {
            return $user->hasPermissionTo('governorates.view');
        });

        Gate::define('governorates.create', function ($user) {
            return $user->hasPermissionTo('governorates.create');
        });

        Gate::define('governorates.show', function ($user) {
            return $user->hasPermissionTo('governorates.show');
        });

        Gate::define('governorates.edit', function ($user) {
            return $user->hasPermissionTo('governorates.edit');
        });

        Gate::define('governorates.destroy', function ($user) {
            return $user->hasPermissionTo('governorates.destroy');
        });

        Gate::define('governorates.toggle-status', function ($user) {
            return $user->hasPermissionTo('governorates.toggle-status');
        });

        // Areas Management
        Gate::define('areas.view', function ($user) {
            return $user->hasPermissionTo('areas.view');
        });

        Gate::define('areas.create', function ($user) {
            return $user->hasPermissionTo('areas.create');
        });

        Gate::define('areas.show', function ($user) {
            return $user->hasPermissionTo('areas.show');
        });

        Gate::define('areas.edit', function ($user) {
            return $user->hasPermissionTo('areas.edit');
        });

        Gate::define('areas.destroy', function ($user) {
            return $user->hasPermissionTo('areas.destroy');
        });

        Gate::define('areas.toggle-status', function ($user) {
            return $user->hasPermissionTo('areas.toggle-status');
        });

        // ============================================
        // Promotion Management permissions
        // ============================================
        // Banners Management
        Gate::define('banners.view', function ($user) {
            return $user->hasPermissionTo('banners.view');
        });

        Gate::define('banners.create', function ($user) {
            return $user->hasPermissionTo('banners.create');
        });

        Gate::define('banners.show', function ($user) {
            return $user->hasPermissionTo('banners.show');
        });

        Gate::define('banners.edit', function ($user) {
            return $user->hasPermissionTo('banners.edit');
        });

        Gate::define('banners.destroy', function ($user) {
            return $user->hasPermissionTo('banners.destroy');
        });

        Gate::define('banners.toggle-status', function ($user) {
            return $user->hasPermissionTo('banners.toggle-status');
        });

        // ============================================
        // Support & Contact Management permissions
        // ============================================
        // FAQs Management
        Gate::define('faqs.view', function ($user) {
            return $user->hasPermissionTo('faqs.view');
        });

        Gate::define('faqs.create', function ($user) {
            return $user->hasPermissionTo('faqs.create');
        });

        Gate::define('faqs.show', function ($user) {
            return $user->hasPermissionTo('faqs.show');
        });

        Gate::define('faqs.edit', function ($user) {
            return $user->hasPermissionTo('faqs.edit');
        });

        Gate::define('faqs.destroy', function ($user) {
            return $user->hasPermissionTo('faqs.destroy');
        });

        Gate::define('faqs.toggle-status', function ($user) {
            return $user->hasPermissionTo('faqs.toggle-status');
        });

        // ============================================
        // Finance Management permissions
        // ============================================
        // Payment Methods Management
        Gate::define('payment-methods.view', function ($user) {
            return $user->hasPermissionTo('payment-methods.view');
        });

        Gate::define('payment-methods.create', function ($user) {
            return $user->hasPermissionTo('payment-methods.create');
        });

        Gate::define('payment-methods.show', function ($user) {
            return $user->hasPermissionTo('payment-methods.show');
        });

        Gate::define('payment-methods.edit', function ($user) {
            return $user->hasPermissionTo('payment-methods.edit');
        });

        Gate::define('payment-methods.destroy', function ($user) {
            return $user->hasPermissionTo('payment-methods.destroy');
        });

        Gate::define('payment-methods.toggle-status', function ($user) {
            return $user->hasPermissionTo('payment-methods.toggle-status');
        });

        // Subscription Packages Management
        Gate::define('subscription-packages.view', function ($user) {
            return $user->hasPermissionTo('subscription-packages.view');
        });

        Gate::define('subscription-packages.create', function ($user) {
            return $user->hasPermissionTo('subscription-packages.create');
        });

        Gate::define('subscription-packages.show', function ($user) {
            return $user->hasPermissionTo('subscription-packages.show');
        });

        Gate::define('subscription-packages.edit', function ($user) {
            return $user->hasPermissionTo('subscription-packages.edit');
        });

        Gate::define('subscription-packages.destroy', function ($user) {
            return $user->hasPermissionTo('subscription-packages.destroy');
        });

        Gate::define('subscription-packages.toggle-status', function ($user) {
            return $user->hasPermissionTo('subscription-packages.toggle-status');
        });

        Gate::define('subscription-packages.toggle-featured', function ($user) {
            return $user->hasPermissionTo('subscription-packages.toggle-featured');
        });

        // Clinic Subscriptions Management
        Gate::define('clinics-subscriptions.view', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.view');
        });

        Gate::define('clinics-subscriptions.create', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.create');
        });

        Gate::define('clinics-subscriptions.show', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.show');
        });

        Gate::define('clinics-subscriptions.edit', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.edit');
        });

        Gate::define('clinics-subscriptions.destroy', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.destroy');
        });

        Gate::define('clinics-subscriptions.toggle-status', function ($user) {
            return $user->hasPermissionTo('clinics-subscriptions.toggle-status');
        });

        // ============================================
        // Notifications Management permissions
        // ============================================
        // Notifications Management
        Gate::define('notifications.view', function ($user) {
            // Allow clinic and clinic_manager roles to view their notifications
            if ($user->hasRole(['clinic', 'clinic_manager'])) {
                return true;
            }
            return $user->hasPermissionTo('notifications.view');
        });

        Gate::define('notifications.create', function ($user) {
            return $user->hasPermissionTo('notifications.create');
        });

        Gate::define('notifications.show', function ($user) {
            // Allow clinic and clinic_manager roles to view their notifications
            if ($user->hasRole(['clinic', 'clinic_manager'])) {
                return true;
            }
            return $user->hasPermissionTo('notifications.show');
        });

        Gate::define('notifications.edit', function ($user) {
            return $user->hasPermissionTo('notifications.edit');
        });

        Gate::define('notifications.destroy', function ($user) {
            // Allow clinic and clinic_manager roles to delete their own notifications
            if ($user->hasRole(['clinic', 'clinic_manager'])) {
                return true;
            }
            return $user->hasPermissionTo('notifications.destroy');
        });

        Gate::define('notifications.mark-read', function ($user) {
            // Allow clinic and clinic_manager roles to mark their notifications as read
            if ($user->hasRole(['clinic', 'clinic_manager'])) {
                return true;
            }
            return $user->hasPermissionTo('notifications.mark-read');
        });

        Gate::define('notifications.mark-all-read', function ($user) {
            // Allow clinic and clinic_manager roles to mark all their notifications as read
            if ($user->hasRole(['clinic', 'clinic_manager'])) {
                return true;
            }
            return $user->hasPermissionTo('notifications.mark-all-read');
        });

        Gate::define('notifications.activate', function ($user) {
            return $user->hasPermissionTo('notifications.activate');
        });

        Gate::define('notifications.deactivate', function ($user) {
            return $user->hasPermissionTo('notifications.deactivate');
        });

        // Broadcast Management
        Gate::define('broadcasts.view', function ($user) {
            return $user->hasPermissionTo('broadcasts.view');
        });

        Gate::define('broadcasts.create', function ($user) {
            return $user->hasPermissionTo('broadcasts.create');
        });

        Gate::define('broadcasts.show', function ($user) {
            return $user->hasPermissionTo('broadcasts.show');
        });

        Gate::define('broadcasts.edit', function ($user) {
            return $user->hasPermissionTo('broadcasts.edit');
        });

        Gate::define('broadcasts.destroy', function ($user) {
            return $user->hasPermissionTo('broadcasts.destroy');
        });

        Gate::define('broadcasts.send', function ($user) {
            return $user->hasPermissionTo('broadcasts.send');
        });

        Gate::define('broadcasts.activate', function ($user) {
            return $user->hasPermissionTo('broadcasts.activate');
        });

        Gate::define('broadcasts.deactivate', function ($user) {
            return $user->hasPermissionTo('broadcasts.deactivate');
        });

        // ============================================
        // Site Settings permissions
        // ============================================
        // Site Settings - General
        Gate::define('site-settings.general.view', function ($user) {
            return $user->hasPermissionTo('site-settings.general.view');
        });

        Gate::define('site-settings.general.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.general.edit');
        });

        // Site Settings - Vendor
        Gate::define('site-settings.vendor.view', function ($user) {
            return $user->hasPermissionTo('site-settings.vendor.view');
        });

        Gate::define('site-settings.vendor.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.vendor.edit');
        });

        // Site Settings - Contact
        Gate::define('site-settings.contact.view', function ($user) {
            return $user->hasPermissionTo('site-settings.contact.view');
        });

        Gate::define('site-settings.contact.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.contact.edit');
        });

        // Site Settings - Terms
        Gate::define('site-settings.terms.view', function ($user) {
            return $user->hasPermissionTo('site-settings.terms.view');
        });

        Gate::define('site-settings.terms.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.terms.edit');
        });

        // Site Settings - Privacy
        Gate::define('site-settings.privacy.view', function ($user) {
            return $user->hasPermissionTo('site-settings.privacy.view');
        });

        Gate::define('site-settings.privacy.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.privacy.edit');
        });

        // Site Settings - Communication
        Gate::define('site-settings.communication.view', function ($user) {
            return $user->hasPermissionTo('site-settings.communication.view');
        });

        Gate::define('site-settings.communication.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.communication.edit');
        });

        // Site Settings - MyFatoorah
        Gate::define('site-settings.myfatoorah.view', function ($user) {
            return $user->hasPermissionTo('site-settings.myfatoorah.view');
        });

        Gate::define('site-settings.myfatoorah.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.myfatoorah.edit');
        });

        // Site Settings - Support
        Gate::define('site-settings.support.view', function ($user) {
            return $user->hasPermissionTo('site-settings.support.view');
        });

        Gate::define('site-settings.support.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.support.edit');
        });

        // Site Settings - Booking
        Gate::define('site-settings.booking.view', function ($user) {
            return $user->hasPermissionTo('site-settings.booking.view');
        });

        Gate::define('site-settings.booking.edit', function ($user) {
            return $user->hasPermissionTo('site-settings.booking.edit');
        });
    }
}
