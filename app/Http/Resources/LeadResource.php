<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plot_id' => $this->plot_id,
            'plot' => new PlotResource($this->whenLoaded('plot')),
            'admin_user_id' => $this->admin_user_id,
            'admin_user' => new UserResource($this->whenLoaded('adminUser')),
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'message' => $this->message,
            'status' => $this->status,
            'score' => $this->score,
            'metadata' => $this->metadata,
            'histories' => LeadHistoryResource::collection($this->whenLoaded('histories')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}