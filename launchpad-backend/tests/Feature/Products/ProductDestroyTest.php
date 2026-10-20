<?php

use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $product = Product::factory()->create();

    $this->deleteJson("/api/products/{$product->slug}")->assertUnauthorized();
});

it('lets a founder delete their own draft product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $this->actingAs($founder)->deleteJson("/api/products/{$product->slug}")->assertOk();

    expect(Product::find($product->id))->toBeNull();
});

it('rejects deleting a launched product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)->deleteJson("/api/products/{$product->slug}")->assertForbidden();

    expect(Product::find($product->id))->not->toBeNull();
});

it('rejects a member who is not the founder', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $this->actingAs($other)->deleteJson("/api/products/{$product->slug}")->assertForbidden();
});
