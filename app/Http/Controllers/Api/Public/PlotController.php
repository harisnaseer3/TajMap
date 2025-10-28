<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlotResource;
use App\Models\Plot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlotController extends Controller
{
    /**
     * Display a listing of plots
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Plot::query()->with('baseImage');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by sector
        if ($request->has('sector')) {
            $query->where('sector', $request->sector);
        }

        // Filter by block
        if ($request->has('block')) {
            $query->where('block', $request->block);
        }

        // Search by plot number
        if ($request->has('search')) {
            $query->where('plot_number', 'like', '%' . $request->search . '%');
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Filter by area range
        if ($request->has('min_area')) {
            $query->where('area', '>=', $request->min_area);
        }

        if ($request->has('max_area')) {
            $query->where('area', '<=', $request->max_area);
        }

        // Sort
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $plots = $query->paginate($request->input('per_page', 15));

        return PlotResource::collection($plots);
    }

    /**
     * Display the specified plot
     */
    public function show(Plot $plot)
    {
        $plot->load('baseImage');

        return new PlotResource($plot);
    }

    /**
     * Get unique sectors
     */
    public function sectors()
    {
        $sectors = Plot::whereNotNull('sector')
            ->distinct()
            ->pluck('sector')
            ->filter()
            ->values();

        return response()->json(['sectors' => $sectors]);
    }

    /**
     * Get unique blocks
     */
    public function blocks(Request $request)
    {
        $query = Plot::whereNotNull('block')->distinct();

        if ($request->has('sector')) {
            $query->where('sector', $request->sector);
        }

        $blocks = $query->pluck('block')->filter()->values();

        return response()->json(['blocks' => $blocks]);
    }
}