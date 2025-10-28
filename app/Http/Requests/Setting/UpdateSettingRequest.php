<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'key' => ['sometimes', 'string', Rule::unique('settings')->ignore($this->setting), 'max:255'],
            'value' => ['nullable', 'string'],
            'type' => ['sometimes', 'in:string,integer,boolean,json'],
            'group' => ['nullable', 'string', 'max:255'],
            'label' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}