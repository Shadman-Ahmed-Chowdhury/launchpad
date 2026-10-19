<?php

use App\Models\User;

it('logs in with correct credentials', function () {
    $user = User::factory()->create(['email' => 'amina@example.com']);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'amina@example.com',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.user.email', 'amina@example.com')
        ->assertJsonStructure(['data' => ['user', 'token'], 'message']);
});

it('rejects an incorrect password', function () {
    User::factory()->create(['email' => 'amina@example.com']);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'amina@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rejects a login attempt for a google-only account', function () {
    User::factory()->google()->create(['email' => 'amina@example.com']);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'amina@example.com',
        'password' => 'whatever123',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rejects a login attempt for a suspended account', function () {
    User::factory()->suspended()->create([
        'email' => 'amina@example.com',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'amina@example.com',
        'password' => 'password',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rate limits repeated login attempts for the same email', function () {
    User::factory()->create(['email' => 'amina@example.com']);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/login', [
            'email' => 'amina@example.com',
            'password' => 'wrong-password',
        ]);
    }

    $response = $this->postJson('/api/auth/login', [
        'email' => 'amina@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(429);
});
