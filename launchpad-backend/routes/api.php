<?php

use App\Http\Controllers\Accounts\EmailVerificationController;
use App\Http\Controllers\Accounts\GoogleAuthController;
use App\Http\Controllers\Accounts\PasswordController;
use App\Http\Controllers\Accounts\PasswordResetController;
use App\Http\Controllers\Accounts\ProfileController;
use App\Http\Controllers\Accounts\RegisterController;
use App\Http\Controllers\Accounts\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:signup');
    Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:login');
    Route::post('/google', [GoogleAuthController::class, 'store'])->middleware('throttle:login');

    Route::post('/password/forgot', [PasswordResetController::class, 'store'])->middleware('throttle:password-reset');
    Route::post('/password/reset', [PasswordResetController::class, 'update'])->middleware('throttle:password-reset');

    Route::post('/email/verify', [EmailVerificationController::class, 'update'])->middleware('throttle:email-verification');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [SessionController::class, 'destroy']);
        Route::post('/email/verify/resend', [EmailVerificationController::class, 'send'])->middleware('throttle:email-verification');
        Route::put('/password', [PasswordController::class, 'update']);
    });
});

Route::get('/users/{handle}', [ProfileController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [ProfileController::class, 'me']);
    Route::patch('/me', [ProfileController::class, 'update']);
});
