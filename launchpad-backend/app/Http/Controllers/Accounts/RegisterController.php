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
     * Sign up with email + password. The account starts unverified and gets
     * no session — login itself is blocked until the email is confirmed
     * (see ADR-030), so there's nothing useful a token would do yet.
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
        ], status: 201);
    }
}
