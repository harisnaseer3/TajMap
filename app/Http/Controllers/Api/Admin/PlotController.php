<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Plot\StorePlotRequest;
use App\Http\Requests\Plot\UpdatePlotRequest;
use App\Http\Resources\PlotResource;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlotController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Plot::class, 'plot');
    }

    /**
     * Display a listing of plots
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Plot::query()->with('baseImage')->withCount('leads');

        // Include soft deleted
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by sector/block
        if ($request->has('sector')) {
            $query->where('sector', $request->sector);
        }

        if ($request->has('block')) {
            $query->where('block', $request->block);
        }

        // Search
        if ($request->has('search')) {
            $query->where('plot_number', 'like', '%' . $request->search . '%');
        }

        $plots = $query->paginate($request->input('per_page', 15));

        return PlotResource::collection($plots);
    }

    /**
     * Store a newly created plot
     */
    public function store(StorePlotRequest $request): JsonResponse
    {
        $plot = Plot::create($request->validated());

        return response()->json([
            'message' => 'Plot created successfully',
            'plot' => new PlotResource($plot->load('baseImage')),
        ], 201);
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

        return response()->json([
            'message' => 'Plot updated successfully',
            'plot' => new PlotResource($plot->load('baseImage')),
        ]);
    }

    /**
     * Remove the specified plot
     */
    public function destroy(Plot $plot): JsonResponse
    {
        $plot->delete();

        return response()->json([
            'message' => 'Plot deleted successfully',
        ]);
    }

    /**
     * Restore a soft deleted plot
     */
    public function restore($id): JsonResponse
    {
        $plot = Plot::withTrashed()->findOrFail($id);
        $this->authorize('restore', $plot);

        $plot->restore();

        return response()->json([
            'message' => 'Plot restored successfully',
            'plot' => new PlotResource($plot->load('baseImage')),
        ]);
    }
}