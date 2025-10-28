<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'plot_id' => ['sometimes', 'nullable', 'exists:plots,id'],
            'admin_user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'message' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'in:new,contacted,interested,closed'],
            'score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ];
    }
}