<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

function fakeGoogleToken(string $accessToken, array $attributes): void
{
    $socialiteUser = (new SocialiteUser)->map($attributes);

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('userFromToken')->with($accessToken)->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
}

it('creates a new member on first google sign-in', function () {
    fakeGoogleToken('valid-token', [
        'id' => 'google-123',
        'name' => 'Amina Yusuf',
        'email' => 'amina@example.com',
        'avatar' => 'https://lh3.googleusercontent.com/amina.jpg',
    ]);

    $response = $this->postJson('/api/auth/google', ['access_token' => 'valid-token']);

    $response->assertOk()
        ->assertJsonPath('data.user.email', 'amina@example.com')
        ->assertJsonPath('data.user.email_verified', true);

    $user = User::where('email', 'amina@example.com')->first();
    expect($user->auth_provider)->toBe('google');
    expect($user->google_id)->toBe('google-123');
    expect($user->password_hash)->toBeNull();
});

it('logs an existing google member back in without duplicating the account', function () {
    $existing = User::factory()->google()->create(['google_id' => 'google-123']);

    fakeGoogleToken('valid-token', [
        'id' => 'google-123',
        'name' => 'Amina Yusuf',
        'email' => $existing->email,
    ]);

    $this->postJson('/api/auth/google', ['access_token' => 'valid-token'])->assertOk();

    expect(User::where('google_id', 'google-123')->count())->toBe(1);
});

it('refuses to link google sign-in to an existing password account', function () {
    User::factory()->create(['email' => 'amina@example.com']);

    fakeGoogleToken('valid-token', [
        'id' => 'google-123',
        'name' => 'Amina Yusuf',
        'email' => 'amina@example.com',
    ]);

    $this->postJson('/api/auth/google', ['access_token' => 'valid-token'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('rejects an invalid google access token', function () {
    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('userFromToken')->andThrow(new Exception('invalid token'));

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $this->postJson('/api/auth/google', ['access_token' => 'bad-token'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('access_token');
});
