<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class LeadBaseController extends BaseController
{
    /**
     * Display a listing of leads
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Lead::query()->with(['plot', 'adminUser']);

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by assigned admin
        if ($request->has('admin_user_id') && $request->admin_user_id !== '') {
            $query->where('admin_user_id', $request->admin_user_id);
        }

        // Search
        if ($request->has('search') && $request->search !== '') {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // Sort
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $leads = $query->paginate($request->input('per_page', 20));

        return LeadResource::collection($leads);
    }

    /**
     * Display the specified lead
     */
    public function show(Lead $lead): JsonResponse
    {
        $lead->load(['plot', 'adminUser', 'histories.user']);

        return $this->successResponse(
            new LeadResource($lead),
            'Lead retrieved successfully'
        );
    }

    /**
     * Update the specified lead
     */
    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $lead->update($request->validated());

        return $this->successResponse(
            new LeadResource($lead->load(['plot', 'adminUser'])),
            'Lead updated successfully'
        );
    }

    /**
     * Delete the specified lead
     */
    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return $this->successResponse(null, 'Lead deleted successfully');
    }

    /**
     * Assign lead to admin
     */
    public function assign(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'admin_user_id' => ['required', 'exists:users,id'],
        ]);

        $lead->update(['admin_user_id' => $request->admin_user_id]);

        return $this->successResponse(
            new LeadResource($lead->load(['plot', 'adminUser'])),
            'Lead assigned successfully'
        );
    }

    /**
     * Update lead status
     */
    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:new,contacted,interested,closed'],
        ]);

        $lead->update(['status' => $request->status]);

        return $this->successResponse(
            new LeadResource($lead->load(['plot', 'adminUser'])),
            'Lead status updated successfully'
        );
    }

    /**
     * Add note to lead
     */
    public function addNote(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'note' => ['required', 'string'],
        ]);

        $lead->logHistory('note_added', $request->note);

        return $this->successResponse(
            new LeadResource($lead->load(['histories.user'])),
            'Note added successfully'
        );
    }

    /**
     * Export leads to CSV
     */
    public function exportCsv(Request $request)
    {
        Gate::authorize('export', Lead::class);

        $query = Lead::query()->with(['plot', 'adminUser']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $leads = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leads-' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($leads) {
            $file = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Headers
            fputcsv($file, ['ID', 'Name', 'Phone', 'Email', 'Plot', 'Status', 'Score', 'Assigned To', 'Created Date', 'Created Time']);

            // Data
            foreach ($leads as $lead) {
                fputcsv($file, [
                    $lead->id,
                    $lead->name,
                    $lead->phone,
                    $lead->email,
                    $lead->plot?->plot_number ?? 'N/A',
                    $lead->status,
                    $lead->score,
                    $lead->adminUser?->name ?? 'Unassigned',
                    $lead->created_at->format('Y-m-d'),
                    $lead->created_at->format('H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export leads to JSON
     */
    public function exportJson(Request $request)
    {
        Gate::authorize('export', Lead::class);

        $query = Lead::query()->with(['plot', 'adminUser']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $leads = $query->get();

        $headers = [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="leads-' . now()->format('Y-m-d') . '.json"',
        ];

        return response()->json(LeadResource::collection($leads), 200, $headers);
    }
}
