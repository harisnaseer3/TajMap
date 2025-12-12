<?php

use App\Http\Controllers\Api\Admin\AnalyticsBaseController;
use App\Http\Controllers\Api\Admin\LeadBaseController as AdminLeadController;
use App\Http\Controllers\Api\Admin\MediaBaseController;
use App\Http\Controllers\Api\Admin\PlotBaseController as AdminPlotController;
use App\Http\Controllers\Api\Admin\SettingBaseController;
use App\Http\Controllers\Api\Admin\TicketBaseController as AdminTicketController;
use App\Http\Controllers\Api\Admin\UserBaseController;
use App\Http\Controllers\Api\Auth\AuthBaseController;
use App\Http\Controllers\Api\Public\LeadBaseController as PublicLeadController;
use App\Http\Controllers\Api\Public\PlotBaseController as PublicPlotController;
use App\Http\Controllers\Api\User\DashboardBaseController;
use App\Http\Controllers\Api\User\SavedPlotBaseController;
use App\Http\Controllers\Api\User\TicketBaseController as UserTicketController;
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
    Route::get('/plots/meta/streets', [PublicPlotController::class, 'streets']);

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

    // Password Reset Routes
    Route::post('/forgot-password', [AuthBaseController::class, 'forgotPassword'])
        ->middleware('throttle:5,60'); // 5 attempts per 60 minutes
    Route::post('/reset-password', [AuthBaseController::class, 'resetPassword'])
        ->middleware('throttle:5,60'); // 5 attempts per 60 minutes

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthBaseController::class, 'logout']);
        Route::get('/me', [AuthBaseController::class, 'me']);
        Route::post('/change-password', [AuthBaseController::class, 'changePassword']);
    });
});

// Debug route to test authentication
Route::get('/test-auth', function () {
    return response()->json([
        'message' => 'Public endpoint - No auth required',
        'timestamp' => now(),
    ]);
});

// Test email configuration
Route::get('/test-email-config', function () {
    return response()->json([
        'mail_driver' => config('mail.default'),
        'mail_mailers' => config('mail.mailers'),
        'from_address' => config('mail.from.address'),
        'from_name' => config('mail.from.name'),
        'frontend_url' => config('app.frontend_url', config('app.url')),
        'env_mail_mailer' => env('MAIL_MAILER'),
    ]);
});

// Test password reset directly
Route::post('/test-password-reset', function (\Illuminate\Http\Request $request) {
    try {
        $email = $request->input('email');

        // Find user
        $user = \App\Models\User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found', 'email' => $email], 404);
        }

        // Generate token
        $token = \Illuminate\Support\Str::random(64);

        // Save to password_reset_tokens table
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'email' => $email,
                'token' => hash('sha256', $token),
                'created_at' => now()
            ]
        );

        // Generate reset URL
        $resetUrl = config('app.frontend_url', config('app.url'))
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($email);

        return response()->json([
            'success' => true,
            'message' => 'Token created successfully',
            'user' => $user->name,
            'reset_url' => $resetUrl,
            'token' => $token,
            'note' => 'In production, this would be sent via email'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Clear cache route (for development only)
Route::get('/clear-cache', function () {
    try {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\DB::table('cache')->truncate();
        \Illuminate\Support\Facades\DB::table('cache_locks')->truncate();

        // Clear config cache files
        $configPath = base_path('bootstrap/cache/config.php');
        if (file_exists($configPath)) {
            unlink($configPath);
        }

        return response()->json([
            'message' => 'Cache cleared successfully! Rate limits reset. Config cache cleared.',
            'timestamp' => now(),
            'mail_driver' => config('mail.default'),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Cache cleared (some errors occurred but rate limits should be reset)',
            'error' => $e->getMessage(),
        ]);
    }
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

    // Tickets
    Route::get('/tickets', [UserTicketController::class, 'index']);
    Route::post('/tickets', [UserTicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [UserTicketController::class, 'show']);
    Route::post('/tickets/{ticket}/replies', [UserTicketController::class, 'addReply']);
});

// Admin routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Plots - Custom routes must be defined BEFORE apiResource
    Route::post('/plots/bulk-delete', [AdminPlotController::class, 'bulkDelete']);
    Route::get('/plots/download-template', [AdminPlotController::class, 'downloadTemplate']);
    Route::post('/plots/import', [AdminPlotController::class, 'import']);
    Route::get('/plots/export/csv', [AdminPlotController::class, 'exportCsv']);
    Route::get('/plots/export/json', [AdminPlotController::class, 'exportJson']);
    Route::post('/plots/{id}/restore', [AdminPlotController::class, 'restore']);
    Route::apiResource('plots', AdminPlotController::class);

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
    Route::post('/users/{user}/generate-reset-token', [UserBaseController::class, 'generateResetToken']);
    Route::post('/users/{user}/set-temporary-password', [UserBaseController::class, 'setTemporaryPassword']);
    Route::get('/users/password-resets/pending', [UserBaseController::class, 'getPendingResets']);

    // Tickets
    Route::get('/tickets', [AdminTicketController::class, 'index']);
    Route::get('/tickets/statistics', [AdminTicketController::class, 'statistics']);
    Route::get('/tickets/{ticket}', [AdminTicketController::class, 'show']);
    Route::put('/tickets/{ticket}', [AdminTicketController::class, 'update']);
    Route::delete('/tickets/{ticket}', [AdminTicketController::class, 'destroy']);
    Route::post('/tickets/{ticket}/assign', [AdminTicketController::class, 'assign']);
    Route::post('/tickets/{ticket}/status', [AdminTicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket}/priority', [AdminTicketController::class, 'updatePriority']);
    Route::post('/tickets/{ticket}/replies', [AdminTicketController::class, 'addReply']);
});
