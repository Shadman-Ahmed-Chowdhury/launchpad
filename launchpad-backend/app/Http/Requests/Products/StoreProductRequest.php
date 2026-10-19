<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'tagline' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'website_url' => ['required', 'url', 'max:2048'],
            'logo' => ['sometimes', 'image', 'max:2048'],
            'topic_ids' => ['sometimes', 'array', 'max:3'],
            'topic_ids.*' => ['integer', 'exists:topics,id'],
        ];
    }
}
