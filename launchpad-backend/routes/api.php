<?php

use App\Http\Controllers\Accounts\EmailVerificationController;
use App\Http\Controllers\Accounts\GoogleAuthController;
use App\Http\Controllers\Accounts\PasswordController;
use App\Http\Controllers\Accounts\PasswordResetController;
use App\Http\Controllers\Accounts\ProfileController;
use App\Http\Controllers\Accounts\RegisterController;
use App\Http\Controllers\Accounts\ReviewerController;
use App\Http\Controllers\Accounts\SessionController;
use App\Http\Controllers\Accounts\UserController;
use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\Products\ProductReviewController;
use App\Http\Controllers\TopicController;
use App\Http\Controllers\Votes\VoteController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:signup');
    Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:login');
    Route::post('/google', [GoogleAuthController::class, 'store'])->middleware('throttle:login');

    Route::post('/password/forgot', [PasswordResetController::class, 'store'])->middleware('throttle:password-reset');
    Route::post('/password/reset', [PasswordResetController::class, 'update'])->middleware('throttle:password-reset');

    Route::post('/email/verify', [EmailVerificationController::class, 'update'])->middleware('throttle:email-verification');
    Route::post('/email/verify/resend', [EmailVerificationController::class, 'send'])->middleware('throttle:email-verification');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [SessionController::class, 'destroy']);
        Route::put('/password', [PasswordController::class, 'update']);
    });
});

Route::get('/users/{handle}', [ProfileController::class, 'show']);
Route::get('/users/{handle}/products', [ProfileController::class, 'products']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [ProfileController::class, 'me']);
    Route::patch('/me', [ProfileController::class, 'update']);
});

Route::get('/topics', [TopicController::class, 'index']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me/products', [ProductController::class, 'mine']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::patch('/products/{slug}', [ProductController::class, 'update']);
    Route::delete('/products/{slug}', [ProductController::class, 'destroy']);
    Route::post('/products/{slug}/submit', [ProductController::class, 'submit']);
    Route::post('/products/{slug}/schedule', [ProductController::class, 'scheduleLaunch']);
    Route::post('/products/{slug}/votes', [VoteController::class, 'store'])->middleware('throttle:voting');
    Route::delete('/products/{slug}/votes', [VoteController::class, 'destroy'])->middleware('throttle:voting');

    Route::prefix('reviewer')->group(function () {
        Route::get('/products', [ProductReviewController::class, 'index']);
        Route::post('/products/{slug}/approve', [ProductReviewController::class, 'approve']);
        Route::post('/products/{slug}/reject', [ProductReviewController::class, 'reject']);
        Route::post('/products/{slug}/request-changes', [ProductReviewController::class, 'requestChanges']);
    });

    Route::prefix('admin')->group(function () {
        Route::get('/reviewers', [ReviewerController::class, 'index']);
        Route::post('/reviewers', [ReviewerController::class, 'store']);
        Route::patch('/reviewers/{id}', [ReviewerController::class, 'update']);
        Route::delete('/reviewers/{id}', [ReviewerController::class, 'destroy']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users/{id}/suspend', [UserController::class, 'suspend']);
        Route::post('/users/{id}/unsuspend', [UserController::class, 'unsuspend']);
    });
});
