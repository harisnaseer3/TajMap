<?php

use App\Http\Controllers\Api\Admin\AnalyticsBaseController;
use App\Http\Controllers\Api\Admin\LeadBaseController as AdminLeadController;
use App\Http\Controllers\Api\Admin\MediaBaseController;
use App\Http\Controllers\Api\Admin\PlotBaseController as AdminPlotController;
use App\Http\Controllers\Api\Admin\SettingBaseController;
use App\Http\Controllers\Api\Admin\UserBaseController;
use App\Http\Controllers\Api\Auth\AuthBaseController;
use App\Http\Controllers\Api\Public\LeadBaseController as PublicLeadController;
use App\Http\Controllers\Api\Public\PlotBaseController as PublicPlotController;
use App\Http\Controllers\Api\User\DashboardBaseController;
use App\Http\Controllers\Api\User\SavedPlotBaseController;
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

    // Settings (read-only public access)
    Route::get('/settings/group/{group}', [SettingBaseController::class, 'byGroup']);
});

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthBaseController::class, 'register']);
    Route::post('/login', [AuthBaseController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthBaseController::class, 'logout']);
        Route::get('/me', [AuthBaseController::class, 'me']);
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
    Route::get('/dashboard', [DashboardBaseController::class, 'index']);

    // Saved plots
    Route::get('/saved-plots', [SavedPlotBaseController::class, 'index']);
    Route::post('/saved-plots/{plot}', [SavedPlotBaseController::class, 'store']);
    Route::delete('/saved-plots/{plot}', [SavedPlotBaseController::class, 'destroy']);
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
        Route::get('/dashboard', [AnalyticsBaseController::class, 'dashboard']);
        Route::get('/monthly-trends', [AnalyticsBaseController::class, 'monthlyTrends']);
        Route::get('/admin-performance', [AnalyticsBaseController::class, 'adminPerformance']);
        Route::get('/plot-distribution', [AnalyticsBaseController::class, 'plotDistribution']);
    });

    // Media
    Route::apiResource('media', MediaBaseController::class)->except(['update']);

    // Settings
    Route::apiResource('settings', SettingBaseController::class);
    Route::get('/settings/group/{group}', [SettingBaseController::class, 'byGroup']);
    Route::post('/settings/bulk-update', [SettingBaseController::class, 'bulkUpdate']);

    // Users
    Route::apiResource('users', UserBaseController::class);
});
