<?php

use App\Models\Product;
use App\Models\Vote;

it('lists only launched products, most-voted first', function () {
    $launchedHigh = Product::factory()->launched()->create();
    $launchedLow = Product::factory()->launched()->create();
    Product::factory()->create(['status' => 'draft']);

    Vote::factory()->count(3)->create(['product_id' => $launchedHigh->id]);
    Vote::factory()->count(1)->create(['product_id' => $launchedLow->id]);

    $response = $this->getJson('/api/products');

    $response->assertOk()->assertJsonCount(2, 'data');
    expect($response->json('data.0.id'))->toBe($launchedHigh->id);
    expect($response->json('data.0.votes_count'))->toBe(3);
    expect($response->json('data.1.id'))->toBe($launchedLow->id);
});

it('includes pagination metadata', function () {
    Product::factory()->count(2)->launched()->create();

    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonStructure(['data', 'links', 'meta']);
});
