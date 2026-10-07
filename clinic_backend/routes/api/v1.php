<?php

use Illuminate\Support\Facades\Route;
// Controllers (assume these exist, or add TODO if not)
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\TreatmentController;
use App\Http\Controllers\Api\V1\ClinicController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\WalletController;
use App\Http\Controllers\Api\V1\BookingReasonController;
use App\Http\Middleware\UserAccess;

// =========================================
// 1. AUTHENTICATION
// =========================================
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    // Explore Machines (list with filters)
    Route::get('explore-machines', [ClinicController::class, 'exploreMachines']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('verify-reset-otp', [AuthController::class, 'verifyResetOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Social Authentication subfolder
    Route::post('guest-login', [AuthController::class, 'guestLogin']);
    Route::prefix('social')->group(function () {
        Route::post('google', [SocialAuthController::class, 'googleLogin']);
        Route::post('apple', [SocialAuthController::class, 'appleLogin']);
    });
});

// ======================
// AUTH PROTECTED ROUTES
// ======================
Route::middleware(['auth:sanctum', UserAccess::class])->group(function () {
    // =========================================
    // 2. USER PROFILE (User, Governorates, Addresses, Auth)
    // =========================================

    // Auth subfolder (user session/account actions)
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('logout-all-devices', [AuthController::class, 'logoutAllDevices']);
        Route::delete('delete-account', [AuthController::class, 'deleteAccount']);
    });

    Route::prefix('user')->group(function () {
        // Profile (includes medical profile fields)
        Route::put('profile', [UserController::class, 'updateProfile']); // Handles both regular profile and medical profile
        Route::post('avatar', [UserController::class, 'uploadAvatar']);
        // Favorites is in services section too but here for user profile view
        Route::get('favorites', [TreatmentController::class, 'favorites']);

        // Medical Records
        Route::prefix('medical-records')->group(function () {
            Route::get('/', [UserController::class, 'getMedicalRecords']);
            Route::post('/', [UserController::class, 'uploadMedicalRecord']);
            Route::put('{id}', [UserController::class, 'updateMedicalRecord']);
            Route::delete('{id}', [UserController::class, 'deleteMedicalRecord']);
            Route::get('{id}/download', [UserController::class, 'downloadMedicalRecord']);
        });

        // Notification Settings
        Route::get('notification-settings', [UserController::class, 'getNotificationSettings']);
        Route::put('notification-settings', [UserController::class, 'updateNotificationSettings']);
    });


    // =========================================
    // 3. HOME & DISCOVERY
    // =========================================
    Route::prefix('home')->group(function () {
        Route::get('/', [HomeController::class, 'index']);
        Route::get('search', [HomeController::class, 'search']);
        Route::get('filters', [HomeController::class, 'getFilters']);
    });
    Route::get('categories', [HomeController::class, 'categories']);

    // =========================================
    // 4. NOTIFICATIONS
    // =========================================
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::delete('{id}', [NotificationController::class, 'destroy']);
        Route::put('{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('read-all', [NotificationController::class, 'markAllAsRead']);
        Route::put('delete-all', [NotificationController::class, 'deleteAll']);
    });

    // =========================================
    // 5. TREATMENTS (and Clinics, Treatment Reports, Availability)
    // =========================================
    Route::prefix('treatments')->group(function () {
        Route::get('/', [TreatmentController::class, 'index']);

        // Availability (check for multiple treatments)
        Route::post('availability/check', [TreatmentController::class, 'checkAvailability']);
        Route::get('available-machines', [TreatmentController::class, 'getAvailableMachines']);
        Route::get('available-slots', [TreatmentController::class, 'getAvailableSlots']);

        Route::get('{id}', [TreatmentController::class, 'show']);
        Route::post('{id}/favorite', [TreatmentController::class, 'toggleFavorite']);
        Route::get('{id}/reviews', [ReviewController::class, 'getTreatmentReviews']);
        Route::get('{id}/share', [TreatmentController::class, 'getShareLink']);
    });

    Route::prefix('clinics')->group(function () {
        Route::get('favorites', [ClinicController::class, 'favorites']);
        Route::get('{id}/treatments', [ClinicController::class, 'treatments']);
        Route::get('{id}/machines', [ClinicController::class, 'machines']);
        Route::get('{id}/reviews', [ReviewController::class, 'getClinicReviews']);
        Route::get('{id}/reviews', [ClinicController::class, 'reviews']);
        Route::post('{id}/favorite', [ClinicController::class, 'toggleFavorite']);
        Route::get('{id}/share', [ClinicController::class, 'getShareLink']);
        Route::get('{id}/{machineId?}', [ClinicController::class, 'show']);
    });

    // Explore Machines (list with filters)
    Route::get('machines', [ClinicController::class, 'listMachines']);

    Route::prefix('machines')->group(function () {
        Route::get('{id}', [ClinicController::class, 'showMachine']);
        Route::get('{id}/treatments', [ClinicController::class, 'machineTreatments']);
        Route::get('{id}/clinics', [ClinicController::class, 'machineClinics']);
    });

    // =========================================
    // 7. PAYMENTS
    // =========================================
    Route::prefix('payments')->group(function () {
        Route::get('methods', [PaymentController::class, 'methods']);
        Route::post('execute', [PaymentController::class, 'execute']);
    });

    // =========================================
    // 7.1. WALLET
    // =========================================
    Route::prefix('wallet')->group(function () {
        Route::get('balance', [WalletController::class, 'balance']);
        Route::get('transactions', [WalletController::class, 'transactions']);
        Route::post('top-up', [WalletController::class, 'topUp']);
    });

    // =========================================
    // 8. BOOKINGS
    // =========================================
    Route::prefix('bookings')->group(function () {
        // Booking Flow
        Route::post('available-slots', [BookingController::class, 'getAvailableSlots']);
        Route::get('reasons', [BookingReasonController::class, 'index']);
        Route::get('skin-types', [BookingController::class, 'getSkinTypes']);
        Route::get('body-parts', [BookingController::class, 'getBodyParts']);

        // Appointments List & Detail
        Route::get('/', [BookingController::class, 'index']);
        Route::get('history', [BookingController::class, 'getHistory']);
        Route::get('statistics', [BookingController::class, 'getStatistics']);
        Route::post('/', [BookingController::class, 'store']);
        Route::get('{id}', [BookingController::class, 'show']);
        Route::put('{id}', [BookingController::class, 'update']);

        // Appointment Actions
        Route::post('{id}/cancel', [BookingController::class, 'cancel']);
        Route::post('{id}/reschedule', [BookingController::class, 'reschedule']);
        Route::post('{id}/reschedule-all-sessions', [BookingController::class, 'rescheduleAllSessions']);

        // Sessions
        Route::get('{id}/sessions', [BookingController::class, 'getSessions']);

        // Treatment Records
        Route::get('{id}/treatment-records', [BookingController::class, 'getTreatmentRecords']);
    });

    // Reviews
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class, 'store']);
    });

    // =========================================
    // 9. SUPPORT
    // =========================================
    Route::prefix('support')->group(function () {
        Route::get('faqs', [ProfileController::class, 'faqs']);
        Route::get('contact', [ProfileController::class, 'getContactInfo']);
    });
});


// ======================
// AUTH PROTECTED ROUTES
// ======================
Route::get('privacy-policy', [HomeController::class, 'privacy']);
Route::get('terms-and-conditions', [HomeController::class, 'terms']);

// No extra routes; some controllers/actions may need to be implemented.
