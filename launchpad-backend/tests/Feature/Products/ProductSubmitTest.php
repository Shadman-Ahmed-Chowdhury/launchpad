<?php

use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $product = Product::factory()->create();

    $this->postJson("/api/products/{$product->slug}/submit")->assertUnauthorized();
});

it('rejects a member who is not the founder', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id]);

    $this->actingAs($other)->postJson("/api/products/{$product->slug}/submit")->assertForbidden();
});

it('rejects submitting a product that is already pending review', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->pendingReview()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/submit")->assertForbidden();
});

it('lets a founder submit their own draft for review', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $response = $this->actingAs($founder)->postJson("/api/products/{$product->slug}/submit");

    $response->assertOk()->assertJsonPath('data.status', 'pending_review');
    expect($product->refresh())
        ->status->toBe('pending_review')
        ->submitted_at->not->toBeNull();
});

it('lets a founder resubmit a product sent back for changes', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'changes_requested']);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/submit")
        ->assertOk()->assertJsonPath('data.status', 'pending_review');
});
