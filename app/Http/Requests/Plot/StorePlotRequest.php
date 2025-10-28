<?php

namespace App\Http\Requests\Plot;

use Illuminate\Foundation\Http\FormRequest;

class StorePlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'plot_number' => ['required', 'string', 'unique:plots,plot_number', 'max:255'],
            'sector' => ['nullable', 'string', 'max:255'],
            'block' => ['nullable', 'string', 'max:255'],
            'coordinates' => ['required', 'array', 'min:3'],
            'coordinates.*.x' => ['required', 'numeric', 'min:0', 'max:1'],
            'coordinates.*.y' => ['required', 'numeric', 'min:0', 'max:1'],
            'status' => ['required', 'in:available,reserved,sold'],
            'area' => ['required', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'base_image_id' => ['nullable', 'exists:media,id'],
            'base_image_transform' => ['nullable', 'array'],
            'base_image_transform.x' => ['nullable', 'numeric'],
            'base_image_transform.y' => ['nullable', 'numeric'],
            'base_image_transform.scale' => ['nullable', 'numeric', 'min:0'],
            'base_image_transform.rotation' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
        ];
    }
}