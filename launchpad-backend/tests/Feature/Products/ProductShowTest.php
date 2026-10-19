<?php

use App\Models\Product;
use App\Models\Topic;
use App\Models\User;

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

it('lets the founder preview their own draft product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['slug' => 'draft-product', 'status' => 'draft', 'founder_id' => $founder->id]);

    $this->actingAs($founder)->getJson('/api/products/draft-product')
        ->assertOk()
        ->assertJsonPath('data.slug', 'draft-product')
        ->assertJsonPath('data.status', 'draft');
});

it('404s for a draft product viewed by someone other than the founder', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    Product::factory()->create(['slug' => 'draft-product', 'status' => 'draft', 'founder_id' => $founder->id]);

    $this->actingAs($other)->getJson('/api/products/draft-product')->assertNotFound();
});
