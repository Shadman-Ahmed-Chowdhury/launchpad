<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\ForgotPasswordRequest;
use App\Http\Requests\Accounts\ResetPasswordRequest;
use App\Models\AuthToken;
use App\Models\User;
use App\Notifications\Accounts\ResetPasswordNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Request a reset link. Always responds the same way whether or not the
     * email is registered, so this can't be used to enumerate accounts.
     */
    public function store(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if ($user && $user->isPasswordAccount()) {
            $user->notify(new ResetPasswordNotification($user));
        }

        return $this->respond(message: 'If that email is registered, a reset link has been sent.');
    }

    /**
     * Consume the reset token and set a new password. Revokes every active
     * API token for the account, since a password reset likely means the
     * old password leaked.
     */
    public function update(ResetPasswordRequest $request): JsonResponse
    {
        $authToken = AuthToken::consume($request->validated('token'), AuthToken::KIND_RESET_PASSWORD);

        if (! $authToken) {
            throw ValidationException::withMessages([
                'token' => ['This reset link is invalid or has expired.'],
            ]);
        }

        $user = $authToken->user;
        $user->forceFill(['password_hash' => Hash::make($request->validated('password'))])->save();
        $user->tokens()->delete();

        return $this->respond(message: 'Password reset.');
    }
}
