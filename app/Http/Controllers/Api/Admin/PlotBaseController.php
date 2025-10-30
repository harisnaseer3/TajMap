<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Plot\StorePlotRequest;
use App\Http\Requests\Plot\UpdatePlotRequest;
use App\Http\Resources\PlotResource;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlotBaseController extends BaseController
{
    /**
     * Display a listing of plots
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Plot::query();

        // Count before any filtering for debugging
        $totalCount = Plot::count();
        \Log::info('Total plots in database: ' . $totalCount);

        // Try to load relationships
        try {
            $query->with('baseImage')->withCount('leads');
        } catch (\Exception $e) {
            \Log::error('Error loading relationships: ' . $e->getMessage());
            // Continue without relationships if they fail
        }

        // Include soft deleted
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by sector/block
        if ($request->has('sector') && $request->sector !== '') {
            $query->where('sector', $request->sector);
        }

        if ($request->has('block') && $request->block !== '') {
            $query->where('block', $request->block);
        }

        // Search
        if ($request->has('search') && $request->search !== '') {
            $query->where('plot_number', 'like', '%' . $request->search . '%');
        }

        // Log the SQL query for debugging
        $sql = $query->toSql();
        $bindings = $query->getBindings();
        \Log::info('Query SQL: ' . $sql, ['bindings' => $bindings]);

        $plots = $query->paginate($request->input('per_page', 15));

        \Log::info('Plots found: ' . $plots->count());

        return PlotResource::collection($plots);
    }

    /**
     * Store a newly created plot
     */
    public function store(StorePlotRequest $request): JsonResponse
    {
        $plot = Plot::create($request->validated());

        return $this->createdResponse(
            new PlotResource($plot->load('baseImage')),
            'Plot created successfully'
        );
    }

    /**
     * Display the specified plot
     */
    public function show(Plot $plot)
    {
        $plot->load(['baseImage', 'leads']);

        return new PlotResource($plot);
    }

    /**
     * Update the specified plot
     */
    public function update(UpdatePlotRequest $request, Plot $plot): JsonResponse
    {
        $plot->update($request->validated());

        return $this->successResponse(
            new PlotResource($plot->load('baseImage')),
            'Plot updated successfully'
        );
    }

    /**
     * Remove the specified plot
     */
    public function destroy(Plot $plot): JsonResponse
    {
        $plot->delete();

        return $this->successResponse(null, 'Plot deleted successfully');
    }

    /**
     * Restore a soft deleted plot
     */
    public function restore($id): JsonResponse
    {
        $plot = Plot::withTrashed()->findOrFail($id);

        $plot->restore();

        return $this->successResponse(
            new PlotResource($plot->load('baseImage')),
            'Plot restored successfully'
        );
    }
}
