<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Plot\StorePlotRequest;
use App\Http\Requests\Plot\UpdatePlotRequest;
use App\Http\Requests\Plot\ImportPlotRequest;
use App\Http\Resources\PlotResource;
use App\Models\Plot;
use App\Imports\PlotImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PlotBaseController extends BaseController
{
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
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by sector/street
        if ($request->has('sector') && $request->sector !== '') {
            $query->where('sector', $request->sector);
        }

        if ($request->has('street') && $request->street !== '') {
            $query->where('street', $request->street);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== '') {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category') && $request->category !== '') {
            $query->where('category', $request->category);
        }

        // Search
        if ($request->has('search') && $request->search !== '') {
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

    /**
     * Bulk delete plots
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:plots,id',
        ]);

        $deletedCount = Plot::whereIn('id', $request->ids)->delete();

        return $this->successResponse(
            ['deleted_count' => $deletedCount],
            "{$deletedCount} plot(s) deleted successfully"
        );
    }

    /**
     * Clear all plots (for testing/development)
     */
    public function clearAll(): JsonResponse
    {
        $count = Plot::count();
        Plot::query()->forceDelete(); // Permanently delete all plots

        return $this->successResponse(
            ['deleted_count' => $count],
            "All {$count} plots have been deleted"
        );
    }

    /**
     * Download import template
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plot_import_template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 support
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Row 1: Title/ID row (optional, will be ignored during import)
            fputcsv($file, ['Plot Import Template']);

            // Row 2: Headers (this row will be used as column headers)
            fputcsv($file, [
                'Sr No.',
                'Name',
                'Size',
                'Sector',
                'Street',
                'Type',
                'Category',
                'Status',
                'Actions',
            ]);

            // Row 3+: Sample data rows
            fputcsv($file, ['1', 'PLOT-001', '25x50', 'Sector A', 'Main Street', 'Residential', 'Premium', 'available', 'Corner plot with park view']);
            fputcsv($file, ['2', 'PLOT-002', '30x60', 'Sector A', 'Oak Avenue', 'Commercial', 'Standard', 'available', 'Near main road']);
            fputcsv($file, ['3', 'PLOT-003', '1000', 'Sector B', 'Elm Street', 'Residential', 'Premium', 'reserved', 'Reserved for client ABC']);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import plots from XLSX file
     */
    public function import(ImportPlotRequest $request): JsonResponse
    {
        try {
            $import = new PlotImport();

            // Count before import
            $beforeCount = Plot::count();

            Excel::import($import, $request->file('file'));

            $failures = $import->failures();
            $errors = $import->errors();

            // Count after import
            $afterCount = Plot::count();
            $newlyCreated = $afterCount - $beforeCount;

            if ($failures->isNotEmpty() || $errors->isNotEmpty()) {
                $failureMessages = [];

                foreach ($failures as $failure) {
                    $failureMessages[] = [
                        'row' => $failure->row(),
                        'attribute' => $failure->attribute(),
                        'errors' => $failure->errors(),
                        'values' => $failure->values(),
                    ];
                }

                foreach ($errors as $error) {
                    $failureMessages[] = [
                        'error' => $error->getMessage(),
                    ];
                }

                return $this->errorResponse(
                    'Import completed with errors',
                    422,
                    [
                        'failures' => $failureMessages,
                        'newly_created' => $newlyCreated,
                        'total_plots' => $afterCount,
                    ]
                );
            }

            return $this->successResponse(
                [
                    'newly_created' => $newlyCreated,
                    'total_plots' => $afterCount,
                ],
                $newlyCreated > 0
                    ? "{$newlyCreated} new plot(s) created successfully. Existing plots were updated."
                    : "Import completed. All plots already existed and were updated."
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Failed to import plots: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Export plots to CSV
     */
    public function exportCsv(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        try {
            $plots = $this->getFilteredPlots($request);

            $filename = 'plots_' . now()->format('Y-m-d_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function () use ($plots) {
                $file = fopen('php://output', 'w');

                // Add BOM for Excel UTF-8 support
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                // Headers
                fputcsv($file, [
                    'ID',
                    'Name',
                    'Size',
                    'Sector',
                    'Street',
                    'Type',
                    'Category',
                    'Status',
                    'Actions',
                    'Price',
                    'Created At',
                ]);

                // Data rows
                foreach ($plots as $plot) {
                    fputcsv($file, [
                        $plot->id,
                        $plot->plot_number,
                        $plot->area ?? '',
                        $plot->sector ?? '',
                        $plot->street ?? '',
                        $plot->type ?? '',
                        $plot->category ?? '',
                        $plot->status ?? '',
                        $plot->description ?? '',
                        $plot->price ?? '',
                        $plot->created_at?->format('Y-m-d H:i:s') ?? '',
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            \Log::error('CSV Export Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export plots: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export plots to JSON
     */
    public function exportJson(Request $request): JsonResponse
    {
        try {
            $plots = $this->getFilteredPlots($request);

            $filename = 'plots_' . now()->format('Y-m-d_His') . '.json';

            return response()->json(
                PlotResource::collection($plots),
                200,
                [
                    'Content-Type' => 'application/json',
                    'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                ]
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Failed to export plots: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get filtered plots for export
     */
    private function getFilteredPlots(Request $request)
    {
        $query = Plot::query()->with('baseImage');

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by sector
        if ($request->has('sector') && $request->sector !== '') {
            $query->where('sector', $request->sector);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== '') {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category') && $request->category !== '') {
            $query->where('category', $request->category);
        }

        return $query->get();
    }
}
