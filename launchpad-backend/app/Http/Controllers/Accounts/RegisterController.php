<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\RegisterRequest;
use App\Http\Resources\Accounts\AuthUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    /**
     * Sign up with email + password. The account starts unverified — votes
     * and comments don't count until the email is confirmed (ADR-010).
     */
    public function store(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = new User;
        $user->forceFill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'handle' => User::generateUniqueHandle($data['first_name'], $data['last_name']),
            'auth_provider' => 'password',
            'password_hash' => Hash::make($data['password']),
        ])->save();

        $user->sendEmailVerificationNotification();

        return $this->respond([
            'user' => new AuthUserResource($user),
            'token' => $user->createToken('api')->plainTextToken,
        ], status: 201);
    }
}
