<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Models\AuthToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmailVerificationController extends Controller
{
    /**
     * Resend the verification email. Public (no auth) — since login is now
     * blocked until the email is verified (see ADR-030), a password-account
     * user who still needs this can't be signed in to ask for it. Looks the
     * user up by `email` instead when there's no Bearer-token caller, and
     * always responds the same way so this can't be used to enumerate
     * accounts (same pattern as PasswordResetController::store()).
     */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user) {
            $request->validate(['email' => ['required', 'email']]);
            $user = User::where('email', $request->string('email'))->first();
        }

        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return $this->respond(message: 'If that account exists and needs verifying, we sent a new email.');
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
