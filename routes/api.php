<?php

use App\Http\Controllers\Api\Admin\AnalyticsController;
use App\Http\Controllers\Api\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Api\Admin\MediaController;
use App\Http\Controllers\Api\Admin\PlotController as AdminPlotController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Public\LeadController as PublicLeadController;
use App\Http\Controllers\Api\Public\PlotController as PublicPlotController;
use App\Http\Controllers\Api\User\DashboardController;
use App\Http\Controllers\Api\User\SavedPlotController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('public')->group(function () {
    // Plots
    Route::get('/plots', [PublicPlotController::class, 'index']);
    Route::get('/plots/{plot}', [PublicPlotController::class, 'show']);
    Route::get('/plots/meta/sectors', [PublicPlotController::class, 'sectors']);
    Route::get('/plots/meta/blocks', [PublicPlotController::class, 'blocks']);

    // Leads
    Route::post('/leads', [PublicLeadController::class, 'store'])
        ->middleware('throttle:5,1'); // Rate limit: 5 requests per minute
});

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Debug route to test authentication
Route::get('/test-auth', function () {
    return response()->json([
        'message' => 'Public endpoint - No auth required',
        'timestamp' => now(),
    ]);
});

Route::middleware('auth:sanctum')->get('/test-auth-protected', function () {
    return response()->json([
        'message' => 'Protected endpoint - Auth successful!',
        'user' => auth()->user(),
        'timestamp' => now(),
    ]);
});

// Authenticated user routes
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Saved plots
    Route::get('/saved-plots', [SavedPlotController::class, 'index']);
    Route::post('/saved-plots/{plot}', [SavedPlotController::class, 'store']);
    Route::delete('/saved-plots/{plot}', [SavedPlotController::class, 'destroy']);
});

// Admin routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Plots
    Route::apiResource('plots', AdminPlotController::class);
    Route::post('/plots/{id}/restore', [AdminPlotController::class, 'restore']);

    // Leads
    Route::apiResource('leads', AdminLeadController::class)->except(['store']);
    Route::post('/leads/{lead}/assign', [AdminLeadController::class, 'assign']);
    Route::post('/leads/{lead}/status', [AdminLeadController::class, 'updateStatus']);
    Route::post('/leads/{lead}/notes', [AdminLeadController::class, 'addNote']);
    Route::get('/leads/export/csv', [AdminLeadController::class, 'exportCsv']);
    Route::get('/leads/export/json', [AdminLeadController::class, 'exportJson']);

    // Analytics
    Route::prefix('analytics')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/monthly-trends', [AnalyticsController::class, 'monthlyTrends']);
        Route::get('/admin-performance', [AnalyticsController::class, 'adminPerformance']);
        Route::get('/plot-distribution', [AnalyticsController::class, 'plotDistribution']);
    });

    // Media
    Route::apiResource('media', MediaController::class)->except(['update']);

    // Settings
    Route::apiResource('settings', SettingController::class);
    Route::get('/settings/group/{group}', [SettingController::class, 'byGroup']);
    Route::post('/settings/bulk-update', [SettingController::class, 'bulkUpdate']);

    // Users
    Route::apiResource('users', UserController::class);
});