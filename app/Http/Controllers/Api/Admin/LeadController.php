<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class LeadController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user() || !$request->user()->isAdmin()) {
                abort(403, 'Unauthorized');
            }
            return $next($request);
        });
    }

    /**
     * Display a listing of leads
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Lead::query()->with(['plot', 'adminUser']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by assigned admin
        if ($request->has('admin_user_id')) {
            $query->where('admin_user_id', $request->admin_user_id);
        }

        // Search
        if ($request->has('search')) {
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
    public function show(Lead $lead)
    {
        $lead->load(['plot', 'adminUser', 'histories.user']);

        return new LeadResource($lead);
    }

    /**
     * Update the specified lead
     */
    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $lead->update($request->validated());

        return response()->json([
            'message' => 'Lead updated successfully',
            'lead' => new LeadResource($lead->load(['plot', 'adminUser'])),
        ]);
    }

    /**
     * Delete the specified lead
     */
    public function destroy(Lead $lead): JsonResponse
    {
        Gate::authorize('delete', $lead);

        $lead->delete();

        return response()->json([
            'message' => 'Lead deleted successfully',
        ]);
    }

    /**
     * Assign lead to admin
     */
    public function assign(Request $request, Lead $lead): JsonResponse
    {
        Gate::authorize('assign', $lead);

        $request->validate([
            'admin_user_id' => ['required', 'exists:users,id'],
        ]);

        $lead->update(['admin_user_id' => $request->admin_user_id]);

        return response()->json([
            'message' => 'Lead assigned successfully',
            'lead' => new LeadResource($lead->load(['plot', 'adminUser'])),
        ]);
    }

    /**
     * Update lead status
     */
    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        Gate::authorize('update', $lead);

        $request->validate([
            'status' => ['required', 'in:new,contacted,interested,closed'],
        ]);

        $lead->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Lead status updated successfully',
            'lead' => new LeadResource($lead->load(['plot', 'adminUser'])),
        ]);
    }

    /**
     * Add note to lead
     */
    public function addNote(Request $request, Lead $lead): JsonResponse
    {
        Gate::authorize('update', $lead);

        $request->validate([
            'note' => ['required', 'string'],
        ]);

        $lead->logHistory('note_added', $request->note);

        return response()->json([
            'message' => 'Note added successfully',
            'lead' => new LeadResource($lead->load(['histories.user'])),
        ]);
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

            // Headers
            fputcsv($file, ['ID', 'Name', 'Phone', 'Email', 'Plot', 'Status', 'Score', 'Assigned To', 'Created At']);

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
                    $lead->created_at->format('Y-m-d H:i:s'),
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