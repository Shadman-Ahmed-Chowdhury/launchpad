<?php

use App\Models\AuthToken;
use App\Models\User;
use App\Notifications\Accounts\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;

it('resends the verification email to an unverified member', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)->postJson('/api/auth/email/verify/resend')->assertOk();

    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

it('does not resend if already verified', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/auth/email/verify/resend')->assertOk();

    Notification::assertNothingSent();
});

it('resends to an unverified member by email, with no session', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create(['email' => 'amina@example.com']);

    $this->postJson('/api/auth/email/verify/resend', ['email' => 'amina@example.com'])->assertOk();

    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

it('gives the same response for an already-verified email, with no session', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'amina@example.com']);

    $response = $this->postJson('/api/auth/email/verify/resend', ['email' => 'amina@example.com']);

    $response->assertOk();
    Notification::assertNothingSent();
});

it('gives the same response for an unregistered email, with no session', function () {
    Notification::fake();

    $response = $this->postJson('/api/auth/email/verify/resend', ['email' => 'nobody@example.com']);

    $response->assertOk();
    Notification::assertNothingSent();
});

it('verifies the email with a valid token', function () {
    $user = User::factory()->unverified()->create();
    $raw = AuthToken::issue($user, AuthToken::KIND_VERIFY_EMAIL, 60);

    $this->postJson('/api/auth/email/verify', ['token' => $raw])->assertOk();

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

it('rejects an invalid verification token', function () {
    $this->postJson('/api/auth/email/verify', ['token' => 'not-a-real-token'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('token');
});

it('rejects a verification token that was already used', function () {
    $user = User::factory()->unverified()->create();
    $raw = AuthToken::issue($user, AuthToken::KIND_VERIFY_EMAIL, 60);

    $this->postJson('/api/auth/email/verify', ['token' => $raw])->assertOk();
    $this->postJson('/api/auth/email/verify', ['token' => $raw])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('token');
});
