<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\BaseController;
use App\Http\Resources\PlotResource;
use App\Models\Plot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlotBaseController extends BaseController
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

        // Filter by street
        if ($request->has('street')) {
            $query->where('street', $request->street);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
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

        return $this->successResponse(['sectors' => $sectors]);
    }

    /**
     * Get unique streets
     */
    public function streets(Request $request)
    {
        $query = Plot::whereNotNull('street')->distinct();

        if ($request->has('sector')) {
            $query->where('sector', $request->sector);
        }

        $streets = $query->pluck('street')->filter()->values();

        return $this->successResponse(['streets' => $streets]);
    }
}
