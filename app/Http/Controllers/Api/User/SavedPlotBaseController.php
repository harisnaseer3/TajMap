<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\BaseController;
use App\Http\Resources\PlotResource;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SavedPlotBaseController extends BaseController
{
    /**
     * Get user's saved plots
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $plots = $request->user()
            ->savedPlots()
            ->with('baseImage')
            ->latest('saved_plots.created_at')
            ->paginate(15);

        return PlotResource::collection($plots);
    }

    /**
     * Save a plot
     */
    public function store(Request $request, Plot $plot): JsonResponse
    {
        $user = $request->user();

        if ($user->savedPlots()->where('plot_id', $plot->id)->exists()) {
            return $this->successResponse([
                'message' => 'Plot already saved',
            ], 400);
        }

        $user->savedPlots()->attach($plot->id);

        return $this->successResponse([
            'message' => 'Plot saved successfully',
        ]);
    }

    /**
     * Remove a saved plot
     */
    public function destroy(Request $request, Plot $plot): JsonResponse
    {
        $request->user()->savedPlots()->detach($plot->id);

        return $this->successResponse([
            'message' => 'Plot removed from saved',
        ]);
    }
}
