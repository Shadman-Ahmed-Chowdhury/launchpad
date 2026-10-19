<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\GoogleLoginRequest;
use App\Http\Resources\Accounts\AuthUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Sign up or log in with Google. The frontend obtains an OAuth2 access
     * token via Google's client SDK and sends it here; we verify it against
     * Google's own userinfo endpoint rather than trusting it blindly (ADR-020).
     */
    public function store(GoogleLoginRequest $request): JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromToken(
                $request->validated('access_token')
            );
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'access_token' => ['That Google token could not be verified.'],
            ]);
        }

        $user = User::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            if (User::where('email', $googleUser->getEmail())->exists()) {
                throw ValidationException::withMessages([
                    'email' => ['An account with this email already exists. Log in with your password instead.'],
                ]);
            }

            [$firstName, $lastName] = $this->splitName($googleUser->getName() ?? $googleUser->getEmail());

            $user = new User;
            $user->forceFill([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $googleUser->getEmail(),
                'handle' => User::generateUniqueHandle($firstName, $lastName),
                'auth_provider' => 'google',
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ])->save();
        }

        if ($user->is_suspended) {
            throw ValidationException::withMessages([
                'email' => ['This account has been suspended.'],
            ]);
        }

        return $this->respond([
            'user' => new AuthUserResource($user),
            'token' => $user->createToken('api')->plainTextToken,
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = explode(' ', trim($name), 2);

        return [$parts[0], $parts[1] ?? ''];
    }
}
