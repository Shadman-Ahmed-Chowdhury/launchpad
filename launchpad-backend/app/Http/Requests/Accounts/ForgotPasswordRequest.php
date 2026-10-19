<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
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
        // Intentionally does not check `exists:users` — the response is the
        // same whether or not the email is registered, so this endpoint
        // can't be used to enumerate accounts.
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
