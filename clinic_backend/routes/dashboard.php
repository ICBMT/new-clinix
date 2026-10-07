<?php

use App\Http\Controllers\Dashboard\ActivityLogController;
use App\Http\Controllers\Dashboard\AdminManagementController;
use App\Http\Controllers\Dashboard\BroadcastController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\NotificationController;
use App\Http\Controllers\Dashboard\PasswordController;
use App\Http\Controllers\Dashboard\PayoutManagementController;
use App\Http\Controllers\Dashboard\EarningsManagementController;
use App\Http\Controllers\Dashboard\ProfileController;
use App\Http\Controllers\Dashboard\RefundManagementController;
use App\Http\Controllers\Dashboard\RoleManagementController;
use App\Http\Controllers\Dashboard\SiteSettingController;
use App\Http\Controllers\Dashboard\TwoFactorController;
use App\Http\Controllers\Dashboard\UserManagementController;
use App\Http\Controllers\Dashboard\ClinicManagementController;
use App\Http\Controllers\Dashboard\ClinicBookingManagementController;
use App\Http\Controllers\Dashboard\ClinicAddressManagementController;
use App\Http\Controllers\Dashboard\ClinicOperatingHoursManagementController;
use App\Http\Controllers\Dashboard\ClinicPayoutManagementController;
use App\Http\Controllers\Dashboard\ClinicStaffManagementController;
use App\Http\Controllers\Dashboard\CategoryManagementController;
use App\Http\Controllers\Dashboard\GovernorateManagementController;
use App\Http\Controllers\Dashboard\AreaManagementController;
use App\Http\Controllers\Dashboard\TreatmentManagementController;
use App\Http\Controllers\Dashboard\BannerManagementController;
use App\Http\Controllers\Dashboard\BookingManagementController;
use App\Http\Controllers\Dashboard\ReviewManagementController;
use App\Http\Controllers\Dashboard\CommissionManagementController;
use App\Http\Controllers\Dashboard\MachineManagementController;
use App\Http\Controllers\Dashboard\SubscriptionPackageManagementController;
use App\Http\Controllers\Dashboard\FaqManagementController;
use App\Http\Controllers\Dashboard\TreatmentSlotManagementController;
use App\Http\Controllers\Dashboard\ClinicSubscriptionManagementController;
use App\Http\Controllers\Dashboard\ContactManagementController;
use App\Http\Controllers\Dashboard\TransactionManagementController;
use App\Http\Controllers\Dashboard\BookingDocumentManagementController;
use App\Http\Controllers\Dashboard\FavoriteManagementController;
use App\Http\Controllers\Dashboard\PaymentMethodManagementController;
use App\Http\Controllers\Dashboard\DeviceTokenController;
use GuzzleHttp\Middleware;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
|
| All admin panel routes with 'dashboard.' prefix
| Protected by auth, verified, and admin middleware
|
*/

Route::middleware(['auth', 'verified', 'check-admin-panel-access'])->prefix('dashboard')->name('dashboard.')->group(function () {
    
    // Main Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('index');

    // Profile Settings
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    });

    // Password Settings
    Route::prefix('password')->name('password.')->group(function () {
        Route::get('/edit', [PasswordController::class, 'edit'])->name('edit');
        Route::put('/', [PasswordController::class, 'update'])->name('update');
    });

    // Two-Factor Authentication
    Route::prefix('two-factor')->name('two-factor.')->group(function () {
        Route::get('/', [TwoFactorController::class, 'show'])->name('show');
    });

    // User Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('users', UserManagementController::class);
        // Add POST route for update to handle FormData with method spoofing
        Route::post('/users/{user}', [UserManagementController::class, 'update'])->name('users.update.post');
        Route::patch('/users/{user}/toggle-email-verification', [UserManagementController::class, 'toggleEmailVerification'])->name('users.toggle-email-verification');
        Route::patch('/users/{user}/toggle-phone-verification', [UserManagementController::class, 'togglePhoneVerification'])->name('users.toggle-phone-verification');
        Route::patch('/users/{user}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('users.toggle-status');
    });

    // Clinic Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('clinics', ClinicManagementController::class);
        Route::patch('/clinics/{clinic}/approve', [ClinicManagementController::class, 'approve'])->name('clinics.approve');
        Route::patch('/clinics/{clinic}/reject', [ClinicManagementController::class, 'reject'])->name('clinics.reject');
        Route::patch('/clinics/{clinic}/toggle-featured', [ClinicManagementController::class, 'toggleFeatured'])->name('clinics.toggle-featured');
        Route::patch('/clinics/{clinic}/toggle-auto-confirm', [ClinicManagementController::class, 'toggleAutoConfirm'])->name('clinics.toggle-auto-confirm');
        Route::patch('/clinics/{clinic}/office-hours', [ClinicManagementController::class, 'updateOfficeHours'])->name('clinics.update-office-hours');
        Route::patch('/clinics/{clinic}/users', [ClinicManagementController::class, 'updateUsers'])->name('clinics.update-users');
        Route::get('/clinics/{clinic}/bookings', [ClinicManagementController::class, 'bookings'])->name('clinics.bookings');
        Route::get('/clinics/{clinic}/payouts', [ClinicManagementController::class, 'payouts'])->name('clinics.payouts');
        Route::get('/clinics/{clinic}/subscriptions', [ClinicManagementController::class, 'subscriptions'])->name('clinics.subscriptions');
    });

    // Clinics Bookings Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/clinics-bookings', [ClinicBookingManagementController::class, 'index'])->name('clinics-bookings.index');
        Route::get('/clinics-bookings/{id}', [ClinicBookingManagementController::class, 'show'])->name('clinics-bookings.show');
        Route::patch('/clinics-bookings/{id}', [ClinicBookingManagementController::class, 'update'])->name('clinics-bookings.update');
        Route::post('/clinics-bookings/{id}/reschedule', [ClinicBookingManagementController::class, 'reschedule'])->name('clinics-bookings.reschedule');
        Route::post('/clinics-bookings/{id}/cancel', [ClinicBookingManagementController::class, 'cancel'])->name('clinics-bookings.cancel');
        Route::post('/clinics-bookings/{id}/reject', [ClinicBookingManagementController::class, 'reject'])->name('clinics-bookings.reject');
        Route::post('/clinics-bookings/{id}/complete', [ClinicBookingManagementController::class, 'complete'])->name('clinics-bookings.complete');
        Route::post('/clinics-bookings/{id}/accept', [ClinicBookingManagementController::class, 'accept'])->name('clinics-bookings.accept');
    });

    // Clinics Address Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/clinics-address', [ClinicAddressManagementController::class, 'index'])->name('clinics-address.index');
        Route::get('/clinics-address/{id}', [ClinicAddressManagementController::class, 'show'])->name('clinics-address.show');
        Route::get('/clinics-address/{id}/edit', [ClinicAddressManagementController::class, 'edit'])->name('clinics-address.edit');
        Route::patch('/clinics-address/{id}', [ClinicAddressManagementController::class, 'update'])->name('clinics-address.update');
    });

    // Category Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('categories', CategoryManagementController::class);
        Route::patch('/categories/{id}/toggle-status', [CategoryManagementController::class, 'toggleStatus'])->name('categories.toggle-status');
    });

    // Location Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        // Governorates
        Route::resource('governorates', GovernorateManagementController::class)->parameters(['governorates' => 'id']);
        Route::patch('/governorates/{id}/toggle-status', [GovernorateManagementController::class, 'toggleStatus'])->name('governorates.toggle-status');
        
        // Areas
        Route::resource('areas', AreaManagementController::class)->parameters(['areas' => 'id']);
        Route::patch('/areas/{id}/toggle-status', [AreaManagementController::class, 'toggleStatus'])->name('areas.toggle-status');
    });

    // Treatments Management (under Clinics Management group)
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('treatments', TreatmentManagementController::class)->parameters(['treatments' => 'id']);
        // Add POST route for update to handle FormData with file uploads
        Route::post('/treatments/{id}', [TreatmentManagementController::class, 'update'])->name('treatments.update.post');
        Route::patch('/treatments/{id}/toggle-status', [TreatmentManagementController::class, 'toggleStatus'])->name('treatments.toggle-status');
        Route::patch('/treatments/{id}/toggle-featured', [TreatmentManagementController::class, 'toggleFeatured'])->name('treatments.toggle-featured');
        Route::patch('/treatments/{id}/toggle-fast-booking', [TreatmentManagementController::class, 'toggleFastBooking'])->name('treatments.toggle-fast-booking');
        
        // Treatment Slots (keeping for backward compatibility, but hidden from UI)
        Route::resource('treatment-slots', TreatmentSlotManagementController::class)->parameters(['treatment-slots' => 'id']);
        Route::patch('/treatment-slots/{id}/toggle-status', [TreatmentSlotManagementController::class, 'toggleStatus'])->name('treatment-slots.toggle-status');
        
        // Treatment Weekly Hours (new menu item)
        Route::get('/treatment-weekly-hours', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'index'])->name('treatment-weekly-hours.index');
        Route::get('/treatment-weekly-hours/create', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'create'])->name('treatment-weekly-hours.create');
        Route::post('/treatment-weekly-hours', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'store'])->name('treatment-weekly-hours.store');
        Route::get('/treatment-weekly-hours/{clinic}/{treatment}/edit', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'edit'])->name('treatment-weekly-hours.edit');
        Route::put('/treatment-weekly-hours/{clinic}/{treatment}', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'update'])->name('treatment-weekly-hours.update');
        Route::patch('/treatment-weekly-hours/{clinic}/{treatment}/toggle-status', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'toggleStatus'])->name('treatment-weekly-hours.toggle-status');
        Route::delete('/treatment-weekly-hours/{clinic}/{treatment}', [\App\Http\Controllers\Dashboard\TreatmentWeeklyHoursController::class, 'destroy'])->name('treatment-weekly-hours.destroy');
    });

    // Machines Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('machines', MachineManagementController::class)->parameters(['machines' => 'id']);
        // Add POST route for update to handle FormData with file uploads
        Route::post('/machines/{id}', [MachineManagementController::class, 'update'])->name('machines.update.post');
        Route::patch('/machines/{id}/toggle-status', [MachineManagementController::class, 'toggleStatus'])->name('machines.toggle-status');
        Route::patch('/machines/{id}/approve', [MachineManagementController::class, 'approve'])->name('machines.approve');
        Route::patch('/machines/{id}/reject', [MachineManagementController::class, 'reject'])->name('machines.reject');
    });

    // Subscription Plans Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('subscription-packages', SubscriptionPackageManagementController::class)->parameters(['subscription-packages' => 'id']);
        Route::patch('/subscription-packages/{id}/toggle-status', [SubscriptionPackageManagementController::class, 'toggleStatus'])->name('subscription-packages.toggle-status');
        Route::patch('/subscription-packages/{id}/toggle-featured', [SubscriptionPackageManagementController::class, 'toggleFeatured'])->name('subscription-packages.toggle-featured');
        
        // Clinic Subscriptions
        Route::resource('clinic-subscriptions', ClinicSubscriptionManagementController::class)->parameters(['clinic-subscriptions' => 'id']);
        Route::patch('/clinic-subscriptions/{id}/toggle-status', [ClinicSubscriptionManagementController::class, 'toggleStatus'])->name('clinic-subscriptions.toggle-status');
    });

    // Clinics Operating Hours Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/clinics-operating-hours', [ClinicOperatingHoursManagementController::class, 'index'])->name('clinics-operating-hours.index');
        Route::get('/clinics-operating-hours/{id}', [ClinicOperatingHoursManagementController::class, 'show'])->name('clinics-operating-hours.show');
        Route::get('/clinics-operating-hours/{id}/edit', [ClinicOperatingHoursManagementController::class, 'edit'])->name('clinics-operating-hours.edit');
        Route::patch('/clinics-operating-hours/{id}', [ClinicOperatingHoursManagementController::class, 'update'])->name('clinics-operating-hours.update');
    });

    // Clinics Subscriptions Management (separate from clinic-subscriptions)
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/clinics-subscriptions', [ClinicSubscriptionManagementController::class, 'index'])->name('clinics-subscriptions.index');
        Route::get('/clinics-subscriptions/create', [ClinicSubscriptionManagementController::class, 'create'])->name('clinics-subscriptions.create');
        Route::post('/clinics-subscriptions', [ClinicSubscriptionManagementController::class, 'store'])->name('clinics-subscriptions.store');
        Route::get('/clinics-subscriptions/{id}', [ClinicSubscriptionManagementController::class, 'show'])->name('clinics-subscriptions.show');
        Route::get('/clinics-subscriptions/{id}/edit', [ClinicSubscriptionManagementController::class, 'edit'])->name('clinics-subscriptions.edit');
        Route::patch('/clinics-subscriptions/{id}', [ClinicSubscriptionManagementController::class, 'update'])->name('clinics-subscriptions.update');
    });

    // Clinics Payouts Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/clinics-payouts', [ClinicPayoutManagementController::class, 'index'])->name('clinics-payouts.index');
        Route::get('/clinics-payouts/{id}', [ClinicPayoutManagementController::class, 'show'])->name('clinics-payouts.show');
        Route::post('/clinics-payouts/process', [ClinicPayoutManagementController::class, 'process'])->name('clinics-payouts.process');
        Route::post('/clinics-payouts/{id}/complete', [ClinicPayoutManagementController::class, 'complete'])->name('clinics-payouts.complete');
        Route::post('/clinics-payouts/{id}/fail', [ClinicPayoutManagementController::class, 'fail'])->name('clinics-payouts.fail');
    });

    // Clinics Staff Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/clinics-staff', [ClinicStaffManagementController::class, 'index'])->name('clinics-staff.index');
        Route::get('/clinics-staff/create', [ClinicStaffManagementController::class, 'create'])->name('clinics-staff.create');
        Route::get('/clinics-staff/clinics-by-owner', [ClinicStaffManagementController::class, 'getClinicsByOwner'])->name('clinics-staff.clinics-by-owner');
        Route::post('/clinics-staff', [ClinicStaffManagementController::class, 'store'])->name('clinics-staff.store');
        Route::get('/clinics-staff/{id}', [ClinicStaffManagementController::class, 'show'])->name('clinics-staff.show');
        Route::get('/clinics-staff/{id}/edit', [ClinicStaffManagementController::class, 'edit'])->name('clinics-staff.edit');
        Route::patch('/clinics-staff/{id}', [ClinicStaffManagementController::class, 'update'])->name('clinics-staff.update');
        Route::delete('/clinics-staff/{id}', [ClinicStaffManagementController::class, 'destroy'])->name('clinics-staff.destroy');
    });

    // Promotion and Report Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        // Banners
        Route::resource('banners', BannerManagementController::class)->parameters(['banners' => 'id']);
        // Add POST route for update to handle FormData with file uploads
        Route::post('/banners/{id}', [BannerManagementController::class, 'update'])->name('banners.update.post');
        Route::patch('/banners/{id}/toggle-status', [BannerManagementController::class, 'toggleStatus'])->name('banners.toggle-status');
    });

    // Order Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        // Bookings
        Route::get('/bookings', [BookingManagementController::class, 'index'])->name('bookings.index');
        Route::get('/bookings/{id}', [BookingManagementController::class, 'show'])->name('bookings.show');
        Route::patch('/bookings/{id}', [BookingManagementController::class, 'update'])->name('bookings.update');
        Route::patch('/bookings/{id}/toggle-status', [BookingManagementController::class, 'toggleStatus'])->name('bookings.toggle-status');
        Route::post('/bookings/{id}/accept', [BookingManagementController::class, 'accept'])->name('bookings.accept');
        Route::post('/bookings/{id}/reject', [BookingManagementController::class, 'reject'])->name('bookings.reject');
        Route::post('/bookings/{id}/complete', [BookingManagementController::class, 'complete'])->name('bookings.complete');
        Route::post('/bookings/{id}/reschedule', [BookingManagementController::class, 'reschedule'])->name('bookings.reschedule');
        Route::get('/bookings/{id}/available-slots', [BookingManagementController::class, 'getAvailableSlots'])->name('bookings.available-slots');
        Route::patch('/bookings/{bookingId}/sessions/{sessionId}/status', [BookingManagementController::class, 'updateSessionStatus'])->name('bookings.sessions.update-status');
    });

    // Role Management
    Route::resource('roles', RoleManagementController::class)->parameters(['roles' => 'id']);

    // Admin Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('admins', AdminManagementController::class);
        Route::patch('/admins/{admin}/toggle-email-verification', [AdminManagementController::class, 'toggleEmailVerification'])->name('admins.toggle-email-verification');
        Route::patch('/admins/{admin}/toggle-phone-verification', [AdminManagementController::class, 'togglePhoneVerification'])->name('admins.toggle-phone-verification');
        Route::patch('/admins/{admin}/toggle-status', [AdminManagementController::class, 'toggleStatus'])->name('admins.toggle-status');
    });

    // Activity Logs Management
    Route::resource('activity-logs', ActivityLogController::class)->only(['index', 'show']);
    Route::delete('activity-logs/delete-all', [ActivityLogController::class, 'destroyAll'])->name('activity-logs.delete-all');

    // Notifications Management
    // Define specific routes BEFORE resource route to avoid route conflicts
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])->name('notifications.unread-count');
    Route::get('/notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::patch('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::resource('notifications', NotificationController::class)->only(['index', 'show', 'destroy']);

    // Device Tokens (Web Push Notifications)
    Route::prefix('device-tokens')->name('device-tokens.')->group(function () {
        Route::post('web', [DeviceTokenController::class, 'storeWebToken'])->name('web.store');
        Route::delete('web', [DeviceTokenController::class, 'deleteWebToken'])->name('web.delete');
        Route::post('web/check', [DeviceTokenController::class, 'checkWebToken'])->name('web.check');
    });

    // Broadcast Management
    Route::resource('broadcasts', BroadcastController::class);
    Route::patch('/broadcasts/{broadcast}/send', [BroadcastController::class, 'send'])->name('broadcasts.send');
    Route::post('/broadcasts/{broadcast}/schedule', [BroadcastController::class, 'schedule'])->name('broadcasts.schedule');

    // Earnings Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/earnings', [EarningsManagementController::class, 'index'])->name('earnings.index');
        Route::get('/earnings/{id}', [EarningsManagementController::class, 'show'])->name('earnings.show');
        Route::post('/earnings/clinics/{clinicId}/generate-payout', [EarningsManagementController::class, 'generatePayout'])->name('earnings.generate-payout');
        Route::get('/earnings/clinics/pending', [EarningsManagementController::class, 'getClinicsWithPendingEarnings'])->name('earnings.clinics.pending');
    });

    // Payout Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/payouts', [PayoutManagementController::class, 'index'])->name('payouts.index');
        Route::get('/payouts/{payout}', [PayoutManagementController::class, 'show'])->name('payouts.show');
        Route::post('/payouts/process', [PayoutManagementController::class, 'processPayouts'])->name('payouts.process');
        Route::patch('/payouts/{payout}/complete', [PayoutManagementController::class, 'markCompleted'])->name('payouts.complete');
        Route::patch('/payouts/{payout}/fail', [PayoutManagementController::class, 'markFailed'])->name('payouts.fail');
    });

    // Booking Documents Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('booking-documents', BookingDocumentManagementController::class)->parameters(['booking-documents' => 'id']);
        Route::get('/booking-documents/{id}/download', [BookingDocumentManagementController::class, 'download'])->name('booking-documents.download');
    });

    // Favorites Management (view/delete only)
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/favorites', [FavoriteManagementController::class, 'index'])->name('favorites.index');
        Route::get('/favorites/{id}', [FavoriteManagementController::class, 'show'])->name('favorites.show');
        Route::delete('/favorites/{id}', [FavoriteManagementController::class, 'destroy'])->name('favorites.destroy');
    });

    // Payment Methods Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/payment-methods', [PaymentMethodManagementController::class, 'index'])->name('payment-methods.index');
        Route::get('/payment-methods/{id}', [PaymentMethodManagementController::class, 'show'])->name('payment-methods.show');
        Route::patch('/payment-methods/{id}/toggle-status', [PaymentMethodManagementController::class, 'toggleStatus'])->name('payment-methods.toggle-status');
    });

    // Reviews Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/reviews', [ReviewManagementController::class, 'index'])->name('reviews.index');
        Route::get('/reviews/{id}', [ReviewManagementController::class, 'show'])->name('reviews.show');
        Route::get('/reviews/{id}/edit', [ReviewManagementController::class, 'edit'])->name('reviews.edit');
        Route::patch('/reviews/{id}', [ReviewManagementController::class, 'update'])->name('reviews.update');
        Route::delete('/reviews/{id}', [ReviewManagementController::class, 'destroy'])->name('reviews.destroy');
        Route::patch('/reviews/{id}/approve', [ReviewManagementController::class, 'approve'])->name('reviews.approve');
        Route::patch('/reviews/{id}/reject', [ReviewManagementController::class, 'reject'])->name('reviews.reject');
        Route::patch('/reviews/{id}/toggle-status', [ReviewManagementController::class, 'toggleStatus'])->name('reviews.toggle-status');
    });

    // Commission Settings Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('commission-settings', CommissionManagementController::class)->parameters(['commission-settings' => 'id']);
        Route::patch('/commission-settings/{id}/toggle-status', [CommissionManagementController::class, 'toggleStatus'])->name('commission-settings.toggle-status');
    });

    // Transactions Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/transactions', [TransactionManagementController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/{id}', [TransactionManagementController::class, 'show'])->name('transactions.show');
    });

    // Contacts Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::get('/contacts', [ContactManagementController::class, 'index'])->name('contacts.index');
        Route::get('/contacts/{id}', [ContactManagementController::class, 'show'])->name('contacts.show');
        Route::get('/contacts/{id}/edit', [ContactManagementController::class, 'edit'])->name('contacts.edit');
        Route::patch('/contacts/{id}', [ContactManagementController::class, 'update'])->name('contacts.update');
        Route::delete('/contacts/{id}', [ContactManagementController::class, 'destroy'])->name('contacts.destroy');
        Route::patch('/contacts/{id}/resolve', [ContactManagementController::class, 'resolve'])->name('contacts.resolve');
    });

    // FAQ Management
    Route::group([
        'middleware' => ['check-admin-panel-access'],
    ], function () {
        Route::resource('faqs', FaqManagementController::class)->parameters(['faqs' => 'id']);
        Route::patch('/faqs/{id}/toggle-status', [FaqManagementController::class, 'toggleStatus'])->name('faqs.toggle-status');
    });

    // Site Settings Management
    Route::prefix('site-settings')->name('site-settings.')->group(function () {
        Route::get('/{category}', [SiteSettingController::class, 'show'])->name('show');
        Route::get('/{category}/edit', [SiteSettingController::class, 'edit'])->name('edit');
        Route::put('/{category}', [SiteSettingController::class, 'update'])->name('update');
    });
});
