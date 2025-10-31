<?php

namespace App\Http\Requests\Plot;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $rules = [
            'plot_number' => ['sometimes', 'string', Rule::unique('plots')->ignore($this->plot), 'max:255'],
            'sector' => ['nullable', 'string', 'max:255'],
            'block' => ['nullable', 'string', 'max:255'],
            'coordinates' => ['nullable', 'array'],
            'status' => ['sometimes', 'in:available,reserved,sold'],
            'area' => ['sometimes', 'numeric', 'min:0'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'base_image_id' => ['nullable', 'exists:media,id'],
            'base_image_transform' => ['nullable', 'array'],
            'base_image_transform.x' => ['nullable', 'numeric'],
            'base_image_transform.y' => ['nullable', 'numeric'],
            'base_image_transform.scale' => ['nullable', 'numeric', 'min:0'],
            'base_image_transform.rotation' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
        ];

        // If coordinates are provided and not empty, validate them
        if ($this->has('coordinates') && is_array($this->coordinates) && count($this->coordinates) > 0) {
            $rules['coordinates'] = ['required', 'array', 'min:3'];
            $rules['coordinates.*.x'] = ['required', 'numeric', 'min:0', 'max:1'];
            $rules['coordinates.*.y'] = ['required', 'numeric', 'min:0', 'max:1'];
        }

        return $rules;
    }
}