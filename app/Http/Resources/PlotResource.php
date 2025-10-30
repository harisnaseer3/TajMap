<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plot_number' => $this->plot_number,
            'sector' => $this->sector,
            'block' => $this->block,
            'coordinates' => $this->coordinates,
            'status' => $this->status,
            'area' => $this->area,
            'price' => $this->price,
            'base_image_id' => $this->base_image_id,
            'base_image' => $this->whenLoaded('baseImage', function() {
                return $this->baseImage ? new MediaResource($this->baseImage) : null;
            }),
            'base_image_transform' => $this->base_image_transform,
            'description' => $this->description,
            'features' => $this->features,
            'leads_count' => $this->whenCounted('leads'),
            'is_saved' => $this->when(
                $request->user(),
                fn() => $this->savedByUsers()->where('users.id', $request->user()->id)->exists()
            ),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}