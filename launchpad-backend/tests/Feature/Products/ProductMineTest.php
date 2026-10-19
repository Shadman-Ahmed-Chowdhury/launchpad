<?php

use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $this->getJson('/api/me/products')->assertUnauthorized();
});

it('only returns the authenticated founder\'s own products, any status', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();

    Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    Product::factory()->launched()->create(['founder_id' => $founder->id]);
    Product::factory()->create(['founder_id' => $other->id, 'status' => 'draft']);

    $response = $this->actingAs($founder)->getJson('/api/me/products');

    $response->assertOk()->assertJsonCount(2, 'data');

    $ids = collect($response->json('data'))->pluck('id');
    expect($ids->every(fn ($id) => Product::find($id)->founder_id === $founder->id))->toBeTrue();
});
