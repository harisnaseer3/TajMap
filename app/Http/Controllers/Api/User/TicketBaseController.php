<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Requests\Ticket\StoreTicketReplyRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TicketBaseController extends BaseController
{
    /**
     * Display a listing of user's tickets
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Ticket::query()
            ->where('user_id', auth()->id())
            ->with(['adminUser'])
            ->withCount('replies');

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority !== '') {
            $query->where('priority', $request->priority);
        }

        // Search
        if ($request->has('search') && $request->search !== '') {
            $query->where(function ($q) use ($request) {
                $q->where('subject', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Sort
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $tickets = $query->paginate($request->input('per_page', 15));

        return TicketResource::collection($tickets);
    }

    /**
     * Store a newly created ticket
     */
    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = Ticket::create([
            'user_id' => auth()->id(),
            'subject' => $request->subject,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'status' => 'open',
        ]);

        return $this->createdResponse(
            new TicketResource($ticket->load('user')),
            'Ticket created successfully'
        );
    }

    /**
     * Display the specified ticket
     */
    public function show(Ticket $ticket): JsonResponse
    {
        // Ensure user can only view their own tickets
        if ($ticket->user_id !== auth()->id()) {
            return $this->forbiddenResponse('You do not have permission to view this ticket');
        }

        $ticket->load(['user', 'adminUser', 'replies.user']);

        return $this->successResponse(
            new TicketResource($ticket),
            'Ticket retrieved successfully'
        );
    }

    /**
     * Add a reply to the ticket
     */
    public function addReply(StoreTicketReplyRequest $request, Ticket $ticket): JsonResponse
    {
        // Ensure user can only reply to their own tickets
        if ($ticket->user_id !== auth()->id()) {
            return $this->forbiddenResponse('You do not have permission to reply to this ticket');
        }

        $reply = $ticket->replies()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
        ]);

        return $this->createdResponse(
            new TicketResource($ticket->load(['user', 'adminUser', 'replies.user'])),
            'Reply added successfully'
        );
    }
}
