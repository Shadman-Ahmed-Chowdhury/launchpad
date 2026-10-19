<?php

use App\Models\Product;
use App\Models\Topic;

it('shows a launched product by slug with its topics and vote count', function () {
    $product = Product::factory()->launched()->create(['slug' => 'flowcraft']);
    $topic = Topic::create(['name' => 'Productivity', 'slug' => 'productivity']);
    $product->topics()->attach($topic);

    $response = $this->getJson('/api/products/flowcraft');

    $response->assertOk()
        ->assertJsonPath('data.slug', 'flowcraft')
        ->assertJsonPath('data.votes_count', 0)
        ->assertJsonPath('data.topics.0', 'Productivity');
});

it('404s for a draft product', function () {
    Product::factory()->create(['slug' => 'draft-product', 'status' => 'draft']);

    $this->getJson('/api/products/draft-product')->assertNotFound();
});

it('404s for an unknown slug', function () {
    $this->getJson('/api/products/does-not-exist')->assertNotFound();
});
