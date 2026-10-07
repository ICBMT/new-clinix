<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Api\V1\ProfileController;

// Payment callback routes (public) - accept both GET and POST
// IMPORTANT: These routes must be registered BEFORE other routes to avoid conflicts
Route::match(['get', 'post'], '/payment/callback', [HomeController::class, 'paymentCallback'])->name('payment.callback');
Route::match(['get', 'post'], '/payment/error', [HomeController::class, 'paymentErrorCallback'])->name('payment.error');
Route::post('/payment/webhook', [HomeController::class, 'paymentWebhook'])->name('payment.webhook');

// Welcome/Home page
Route::get('/', [HomeController::class, 'welcome'])->name('home');

// Coming Soon page
Route::get('/coming-soon', [HomeController::class, 'comingSoon'])->name('coming-soon');

// Terms & Conditions
Route::get('/terms', [HomeController::class, 'terms'])->name('terms');

// Privacy Policy
Route::get('/privacy', [HomeController::class, 'privacy'])->name('privacy');

// Contact Us
Route::get('/contact', [HomeController::class, 'contact'])->name('contact');
Route::post('/contact', [HomeController::class, 'submitContact'])->name('contact.submit');

// Language switching route
Route::post('language/{locale}', [HomeController::class, 'switchLanguage'])->name('language.switch');

// Payment success/error pages (React)
Route::get('/payment-success', [HomeController::class, 'paymentSuccess'])->name('payment.success');

Route::get('/payment-error', [HomeController::class, 'paymentError'])->name('payment.error.page');

// Maintenance page (React)
Route::get('/maintenance', [HomeController::class, 'maintenance'])->name('maintenance');

// Public API routes for registration form
Route::get('/api/governorates/{id}/areas', function ($id) {
    $areaRepo = app(\App\Contracts\AreaRepositoryInterface::class);
    $areas = $areaRepo->getActiveAreasByGovernorate((int)$id);
    
    return response()->json($areas->map(function ($area) {
        return [
            'id' => $area->id,
            'name_en' => $area->name_en,
            'name_ar' => $area->name_ar,
            'governorate_id' => $area->governorate_id,
        ];
    }));
})->name('api.governorates.areas');

// Dashboard routes (all admin panel routes with dashboard prefix)
require __DIR__.'/dashboard.php';

// Authentication routes
require __DIR__.'/auth.php';
