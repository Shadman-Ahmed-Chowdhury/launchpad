<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Models\AuthToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmailVerificationController extends Controller
{
    /**
     * Resend the verification email to the authenticated user.
     */
    public function send(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->respond(message: 'Email already verified.');
        }

        $request->user()->sendEmailVerificationNotification();

        return $this->respond(message: 'Verification email sent.');
    }

    /**
     * Confirm the email address from the token emailed to the user. Public
     * (no auth) — the link may be opened on a device the user isn't signed
     * in on.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate(['token' => ['required', 'string']]);

        $authToken = AuthToken::consume($request->string('token')->toString(), AuthToken::KIND_VERIFY_EMAIL);

        if (! $authToken) {
            throw ValidationException::withMessages([
                'token' => ['This verification link is invalid or has expired.'],
            ]);
        }

        $authToken->user->markEmailAsVerified();

        return $this->respond(message: 'Email verified.');
    }
}
