<?php

use App\Models\User;
use App\Notifications\Accounts\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;

it('registers a new member with email and password', function () {
    Notification::fake();

    $response = $this->postJson('/api/auth/register', [
        'first_name' => 'Amina',
        'last_name' => 'Yusuf',
        'email' => 'amina@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.user.email', 'amina@example.com')
        ->assertJsonPath('data.user.handle', 'amina-yusuf')
        ->assertJsonPath('data.user.email_verified', false)
        ->assertJsonStructure(['data' => ['user', 'token'], 'message']);

    $user = User::where('email', 'amina@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->auth_provider)->toBe('password');
    expect($user->password_hash)->not->toBeNull();
    expect($user->email_verified_at)->toBeNull();

    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

it('rejects a duplicate email', function () {
    User::factory()->create(['email' => 'amina@example.com']);

    $response = $this->postJson('/api/auth/register', [
        'first_name' => 'Amina',
        'last_name' => 'Yusuf',
        'email' => 'amina@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rejects a mismatched password confirmation', function () {
    $response = $this->postJson('/api/auth/register', [
        'first_name' => 'Amina',
        'last_name' => 'Yusuf',
        'email' => 'amina@example.com',
        'password' => 'password123',
        'password_confirmation' => 'nope',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('password');
});

it('generates a unique handle when names collide', function () {
    User::factory()->create(['handle' => 'amina-yusuf']);

    $response = $this->postJson('/api/auth/register', [
        'first_name' => 'Amina',
        'last_name' => 'Yusuf',
        'email' => 'amina2@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()->assertJsonPath('data.user.handle', 'amina-yusuf-2');
});

it('rate limits repeated signups from the same ip', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/register', [
            'first_name' => 'Amina',
            'last_name' => 'Yusuf',
            'email' => "amina{$i}@example.com",
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
    }

    $response = $this->postJson('/api/auth/register', [
        'first_name' => 'Amina',
        'last_name' => 'Yusuf',
        'email' => 'aminaX@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(429);
});
