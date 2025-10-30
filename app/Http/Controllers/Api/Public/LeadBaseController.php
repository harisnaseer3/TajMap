<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;

class LeadBaseController extends BaseController
{
    /**
     * Store a new lead
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = Lead::create([
            'plot_id' => $request->plot_id,
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'message' => $request->message,
            'status' => 'new',
        ]);

        // Log creation
        $lead->logHistory('created', 'Lead submitted through public form');

        return $this->successResponse([
            'message' => 'Thank you for your interest! We will contact you soon.',
            'lead' => new LeadResource($lead),
        ], 201);
    }
}
