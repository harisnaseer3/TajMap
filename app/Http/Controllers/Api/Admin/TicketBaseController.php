<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Ticket\UpdateTicketRequest;
use App\Http\Requests\Ticket\StoreTicketReplyRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TicketBaseController extends BaseController
{
    /**
     * Display a listing of all tickets
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Ticket::query()
            ->with(['user', 'adminUser'])
            ->withCount('replies');

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority !== '') {
            $query->where('priority', $request->priority);
        }

        // Filter by assigned admin
        if ($request->has('admin_user_id') && $request->admin_user_id !== '') {
            if ($request->admin_user_id === 'unassigned') {
                $query->whereNull('admin_user_id');
            } else {
                $query->where('admin_user_id', $request->admin_user_id);
            }
        }

        // Search
        if ($request->has('search') && $request->search !== '') {
            $query->where(function ($q) use ($request) {
                $q->where('subject', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function ($userQuery) use ($request) {
                      $userQuery->where('name', 'like', '%' . $request->search . '%')
                               ->orWhere('email', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Sort
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $tickets = $query->paginate($request->input('per_page', 20));

        return TicketResource::collection($tickets);
    }

    /**
     * Display the specified ticket
     */
    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load(['user', 'adminUser', 'replies.user']);

        return $this->successResponse(
            new TicketResource($ticket),
            'Ticket retrieved successfully'
        );
    }

    /**
     * Update the specified ticket
     */
    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket->update($request->validated());

        return $this->successResponse(
            new TicketResource($ticket->load(['user', 'adminUser'])),
            'Ticket updated successfully'
        );
    }

    /**
     * Delete the specified ticket
     */
    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return $this->successResponse(null, 'Ticket deleted successfully');
    }

    /**
     * Assign ticket to admin
     */
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'admin_user_id' => ['required', 'exists:users,id'],
        ]);

        $ticket->update(['admin_user_id' => $request->admin_user_id]);

        return $this->successResponse(
            new TicketResource($ticket->load(['user', 'adminUser'])),
            'Ticket assigned successfully'
        );
    }

    /**
     * Update ticket status
     */
    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
        ]);

        $ticket->update(['status' => $request->status]);

        return $this->successResponse(
            new TicketResource($ticket->load(['user', 'adminUser'])),
            'Ticket status updated successfully'
        );
    }

    /**
     * Update ticket priority
     */
    public function updatePriority(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'priority' => ['required', 'in:low,medium,high,urgent'],
        ]);

        $ticket->update(['priority' => $request->priority]);

        return $this->successResponse(
            new TicketResource($ticket->load(['user', 'adminUser'])),
            'Ticket priority updated successfully'
        );
    }

    /**
     * Add a reply to the ticket
     */
    public function addReply(StoreTicketReplyRequest $request, Ticket $ticket): JsonResponse
    {
        $reply = $ticket->replies()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
        ]);

        return $this->createdResponse(
            new TicketResource($ticket->load(['user', 'adminUser', 'replies.user'])),
            'Reply added successfully'
        );
    }

    /**
     * Get ticket statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total' => Ticket::count(),
            'open' => Ticket::where('status', 'open')->count(),
            'in_progress' => Ticket::where('status', 'in_progress')->count(),
            'resolved' => Ticket::where('status', 'resolved')->count(),
            'closed' => Ticket::where('status', 'closed')->count(),
            'by_priority' => [
                'low' => Ticket::where('priority', 'low')->count(),
                'medium' => Ticket::where('priority', 'medium')->count(),
                'high' => Ticket::where('priority', 'high')->count(),
                'urgent' => Ticket::where('priority', 'urgent')->count(),
            ],
            'unassigned' => Ticket::whereNull('admin_user_id')->count(),
        ];

        return $this->successResponse($stats, 'Statistics retrieved successfully');
    }
}
