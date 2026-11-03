<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Used by reject/request-changes — both require a reason shown to the
 * founder (see docs/01-client-brief.md). Authorization is done in the
 * controller via `ProductPolicy::review()`, same as Store/UpdateProductRequest.
 */
class ReviewProductRequest extends FormRequest
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
            'notes' => ['required', 'string', 'max:2000'],
        ];
    }
}
