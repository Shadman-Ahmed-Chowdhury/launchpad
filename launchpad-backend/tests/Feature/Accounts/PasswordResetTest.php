<?php

use App\Models\AuthToken;
use App\Models\User;
use App\Notifications\Accounts\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;

it('sends a reset link for a registered password account', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'amina@example.com']);

    $this->postJson('/api/auth/password/forgot', ['email' => 'amina@example.com'])->assertOk();

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

it('responds the same way for an email that is not registered', function () {
    Notification::fake();

    $this->postJson('/api/auth/password/forgot', ['email' => 'nobody@example.com'])->assertOk();

    Notification::assertNothingSent();
});

it('does not send a reset link to a google-only account', function () {
    Notification::fake();
    User::factory()->google()->create(['email' => 'amina@example.com']);

    $this->postJson('/api/auth/password/forgot', ['email' => 'amina@example.com'])->assertOk();

    Notification::assertNothingSent();
});

it('resets the password with a valid token and revokes existing sessions', function () {
    $user = User::factory()->create();
    $oldToken = $user->createToken('device-a')->plainTextToken;
    $raw = AuthToken::issue($user, AuthToken::KIND_RESET_PASSWORD, 60);

    $this->postJson('/api/auth/password/reset', [
        'token' => $raw,
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertOk();

    $this->withToken($oldToken)->getJson('/api/me')->assertUnauthorized();

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'new-password123',
    ])->assertOk();
});

it('rejects an invalid or expired reset token', function () {
    $this->postJson('/api/auth/password/reset', [
        'token' => 'not-a-real-token',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertUnprocessable()->assertJsonValidationErrors('token');
});
