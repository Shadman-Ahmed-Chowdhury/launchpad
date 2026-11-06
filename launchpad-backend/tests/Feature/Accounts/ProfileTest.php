<?php

use App\Models\Product;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('shows a public profile by handle without authentication', function () {
    $user = User::factory()->create(['handle' => 'amina-yusuf']);
    $user->links()->create(['label' => 'Website', 'url' => 'https://amina.dev']);

    $response = $this->getJson('/api/users/amina-yusuf');

    $response->assertOk()
        ->assertJsonPath('data.handle', 'amina-yusuf')
        ->assertJsonMissingPath('data.email')
        ->assertJsonCount(1, 'data.links');
});

it('returns 404 for an unknown handle', function () {
    $this->getJson('/api/users/does-not-exist')->assertNotFound();
});

it('includes products launched, member since, and votes received stats', function () {
    $founder = User::factory()->create(['handle' => 'amina-yusuf']);
    $launched = Product::factory()->launched()->create(['founder_id' => $founder->id]);
    Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    Vote::factory()->create(['product_id' => $launched->id]);
    Vote::factory()->retracted()->create(['product_id' => $launched->id]);

    $response = $this->getJson('/api/users/amina-yusuf');

    $response->assertOk()
        ->assertJsonPath('data.products_count', 1)
        ->assertJsonPath('data.votes_received_count', 1)
        ->assertJsonPath('data.member_since', $founder->created_at->toJSON());
});

it('lists only a member\'s launched products, paginated', function () {
    $founder = User::factory()->create(['handle' => 'amina-yusuf']);
    $launched = Product::factory()->launched()->create(['founder_id' => $founder->id]);
    Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $response = $this->getJson('/api/users/amina-yusuf/products');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $launched->id)
        ->assertJsonStructure(['meta', 'links']);
});

it('returns 404 from the member products endpoint for an unknown handle', function () {
    $this->getJson('/api/users/does-not-exist/products')->assertNotFound();
});

it('returns the authenticated member\'s own account with private fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email);
});

it('requires authentication for /me', function () {
    $this->getJson('/api/me')->assertUnauthorized();
});

it('lets a member edit their own profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patchJson('/api/me', [
        'first_name' => 'Updated',
        'bio' => 'New bio',
        'links' => [
            ['label' => 'Twitter', 'url' => 'https://twitter.com/amina'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.first_name', 'Updated')
        ->assertJsonPath('data.bio', 'New bio')
        ->assertJsonCount(1, 'data.links');

    expect($user->refresh()->first_name)->toBe('Updated');
    expect($user->links)->toHaveCount(1);
});

it('rejects a handle already taken by another member', function () {
    User::factory()->create(['handle' => 'taken-handle']);
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson('/api/me', ['handle' => 'taken-handle'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('handle');
});

it('uploads an avatar to the configured uploads disk when editing the profile', function () {
    Storage::fake(config('filesystems.uploads'));
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patchJson('/api/me', [
        'avatar' => UploadedFile::fake()->image('avatar.jpg'),
    ]);

    $response->assertOk();
    expect($user->refresh()->avatar)->not->toBeNull();
    Storage::disk(config('filesystems.uploads'))->assertExists($user->avatar);
});
