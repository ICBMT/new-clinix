<?php

use Illuminate\Support\Facades\Route;


// API Version 1 Routes for Mobile App Users
Route::prefix('v1')->group(function () {
    return require __DIR__ . '/api/v1.php';
});
