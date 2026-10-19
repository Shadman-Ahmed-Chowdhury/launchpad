<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'handle' => [
                'sometimes', 'string', 'max:255', 'alpha_dash',
                Rule::unique('users', 'handle')->ignore($this->user()->id),
            ],
            'bio' => ['sometimes', 'nullable', 'string', 'max:255'],
            'avatar' => ['sometimes', 'image', 'max:2048'],
            'links' => ['sometimes', 'array', 'max:10'],
            'links.*.label' => ['required', 'string', 'max:255'],
            'links.*.url' => ['required', 'url', 'max:2048'],
        ];
    }
}
