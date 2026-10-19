<?php

use App\Models\User;

it('changes the password when the current password is correct', function () {
    $user = User::factory()->create();
    $token = $user->createToken('device-a')->plainTextToken;

    $this->withToken($token)->putJson('/api/auth/password', [
        'current_password' => 'password',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertOk();

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'new-password123',
    ])->assertOk();
});

it('rejects an incorrect current password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/api/auth/password', [
        'current_password' => 'wrong-password',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
});

it('refuses to change the password for a google-only account', function () {
    $user = User::factory()->google()->create();

    $this->actingAs($user)->putJson('/api/auth/password', [
        'current_password' => 'anything',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
});

it('revokes other sessions but keeps the current one after changing password', function () {
    $user = User::factory()->create();
    $currentToken = $user->createToken('device-a')->plainTextToken;
    $otherToken = $user->createToken('device-b')->plainTextToken;

    $this->withToken($currentToken)->putJson('/api/auth/password', [
        'current_password' => 'password',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertOk();

    // Sanctum's guard caches the resolved user per request; each of these
    // simulated requests reuses the same app container, so the cache has
    // to be cleared manually between calls that swap the bearer token.
    $this->app['auth']->forgetGuards();
    $this->withToken($currentToken)->getJson('/api/me')->assertOk();

    $this->app['auth']->forgetGuards();
    $this->withToken($otherToken)->getJson('/api/me')->assertUnauthorized();
});
