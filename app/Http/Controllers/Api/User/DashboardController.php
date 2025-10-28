<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get user dashboard data
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $savedPlotsCount = $user->savedPlots()->count();

        $recentSavedPlots = $user->savedPlots()
            ->with('baseImage')
            ->latest('saved_plots.created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'saved_plots' => $savedPlotsCount,
            ],
            'recent_saved_plots' => $recentSavedPlots,
        ]);
    }
}