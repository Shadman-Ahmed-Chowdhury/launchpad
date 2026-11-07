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

it('lets a founder fully edit a product while it is pending review, without changing its status', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->pendingReview()->create(['founder_id' => $founder->id]);
    $originalSubmittedAt = $product->submitted_at;

    $response = $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", [
        'name' => 'New name',
        'description' => 'Updated description',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'New name')
        ->assertJsonPath('data.status', 'pending_review');

    expect($product->refresh())
        ->description->toBe('Updated description')
        ->submitted_at->toEqual($originalSubmittedAt);
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
    expect($product->refresh())
        ->name->toBe('Original name')
        ->status->toBe('launched');
});

it('blocks a founder from editing a rejected product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'rejected']);

    $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", ['name' => 'New name'])
        ->assertForbidden();
});

it('blocks a founder from editing a taken-down product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'taken_down']);

    $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", ['name' => 'New name'])
        ->assertForbidden();
});

it('lets a founder fully edit an approved product, and sends it back to review', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create([
        'founder_id' => $founder->id,
        'status' => 'approved',
        'name' => 'Original name',
    ]);

    $response = $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", [
        'name' => 'New name',
        'tagline' => 'New tagline',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'New name')
        ->assertJsonPath('data.status', 'pending_review');

    expect($product->refresh())
        ->tagline->toBe('New tagline')
        ->submitted_at->not->toBeNull();
});

it('lets a founder fully edit a scheduled product, sends it back to review, and clears the launch day', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create([
        'founder_id' => $founder->id,
        'status' => 'scheduled',
        'launch_date' => now()->addDays(3)->toDateString(),
    ]);

    $response = $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", [
        'description' => 'Updated description',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'pending_review')
        ->assertJsonPath('data.launch_date', null);

    expect($product->refresh()->launch_date)->toBeNull();
});
