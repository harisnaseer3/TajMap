<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardBaseController extends BaseController
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

        return $this->successResponse([
            'stats' => [
                'saved_plots' => $savedPlotsCount,
            ],
            'recent_saved_plots' => $recentSavedPlots,
        ]);
    }
}
