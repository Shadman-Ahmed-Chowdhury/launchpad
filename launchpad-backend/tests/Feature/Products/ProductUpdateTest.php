<?php

use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $product = Product::factory()->create();

    $this->patchJson("/api/products/{$product->slug}", ['name' => 'New name'])
        ->assertUnauthorized();
});

it('rejects a member who is not the founder', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id]);

    $this->actingAs($other)->patchJson("/api/products/{$product->slug}", ['name' => 'New name'])
        ->assertForbidden();
});

it('lets a founder fully edit their own draft product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $response = $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", [
        'name' => 'New name',
        'tagline' => 'New tagline',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'New name')
        ->assertJsonPath('data.tagline', 'New tagline');
});

it('restricts a founder to description/website_url once launched', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create([
        'founder_id' => $founder->id,
        'name' => 'Original name',
    ]);

    $response = $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", [
        'name' => 'New name',
        'description' => 'Updated description',
    ]);

    $response->assertOk()->assertJsonPath('data.description', 'Updated description');
    expect($product->refresh()->name)->toBe('Original name');
});
