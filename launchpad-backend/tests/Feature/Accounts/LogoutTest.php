<?php

use App\Models\User;

it('revokes only the token used to log out', function () {
    $user = User::factory()->create();
    $tokenA = $user->createToken('device-a')->plainTextToken;
    $tokenB = $user->createToken('device-b')->plainTextToken;

    $this->withToken($tokenA)->postJson('/api/auth/logout')->assertStatus(204);

    // Sanctum's guard caches the resolved user per request; each of these
    // simulated requests reuses the same app container, so the cache has
    // to be cleared manually between calls that swap the bearer token.
    $this->app['auth']->forgetGuards();
    $this->withToken($tokenA)->getJson('/api/me')->assertUnauthorized();

    $this->app['auth']->forgetGuards();
    $this->withToken($tokenB)->getJson('/api/me')->assertOk();
});

it('requires authentication to log out', function () {
    $this->postJson('/api/auth/logout')->assertUnauthorized();
});
