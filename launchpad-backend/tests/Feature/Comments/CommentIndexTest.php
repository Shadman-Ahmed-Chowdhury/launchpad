<?php

use App\Models\Comment;
use App\Models\Product;

it('404s for a product that does not exist', function () {
    $this->getJson('/api/products/does-not-exist/comments')->assertNotFound();
});

it('lists top-level comments newest first, with replies nested oldest first', function () {
    $product = Product::factory()->launched()->create();

    $older = Comment::factory()->create(['product_id' => $product->id, 'created_at' => now()->subHour()]);
    $newer = Comment::factory()->create(['product_id' => $product->id, 'created_at' => now()]);

    $olderReply = Comment::factory()->reply($newer)->create(['created_at' => now()->subMinutes(10)]);
    $newerReply = Comment::factory()->reply($newer)->create(['created_at' => now()->subMinutes(5)]);

    $response = $this->getJson("/api/products/{$product->slug}/comments");

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
    expect($data[0]['id'])->toBe($newer->id);
    expect($data[1]['id'])->toBe($older->id);

    expect($data[0]['replies'])->toHaveCount(2);
    expect($data[0]['replies'][0]['id'])->toBe($olderReply->id);
    expect($data[0]['replies'][1]['id'])->toBe($newerReply->id);
    expect($data[1]['replies'])->toHaveCount(0);
});

it('does not list another product\'s comments', function () {
    $product = Product::factory()->launched()->create();
    $other = Product::factory()->launched()->create();
    Comment::factory()->create(['product_id' => $other->id]);

    $response = $this->getJson("/api/products/{$product->slug}/comments");

    $response->assertOk()->assertJsonCount(0, 'data');
});

it('includes the author on each comment', function () {
    $product = Product::factory()->launched()->create();
    $comment = Comment::factory()->create(['product_id' => $product->id]);

    $response = $this->getJson("/api/products/{$product->slug}/comments");

    $response->assertOk()
        ->assertJsonPath('data.0.author.id', $comment->user->id)
        ->assertJsonPath('data.0.author.handle', $comment->user->handle);
});
