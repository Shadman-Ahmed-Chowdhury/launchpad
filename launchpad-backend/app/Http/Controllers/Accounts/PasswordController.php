<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\ChangePasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    /**
     * Change password from the settings page. Password accounts only —
     * Google accounts have no password to change.
     */
    public function update(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isPasswordAccount()) {
            throw ValidationException::withMessages([
                'current_password' => ['Google accounts don\'t have a password to change.'],
            ]);
        }

        if (! Hash::check($request->validated('current_password'), $user->password_hash)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill(['password_hash' => Hash::make($request->validated('password'))])->save();

        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return $this->respond(message: 'Password changed.');
    }
}
