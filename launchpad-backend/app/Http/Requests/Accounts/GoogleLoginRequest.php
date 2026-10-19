<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class GoogleLoginRequest extends FormRequest
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
            // OAuth2 access token the frontend obtained from Google (not the
            // GSI "One Tap" id_token) — verified server-side against Google's
            // userinfo endpoint via Socialite (see ADR-020).
            'access_token' => ['required', 'string'],
        ];
    }
}
