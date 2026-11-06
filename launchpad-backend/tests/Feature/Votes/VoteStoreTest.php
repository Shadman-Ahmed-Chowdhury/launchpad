<?php

use App\Models\Product;
use App\Models\User;
use App\Models\Vote;

it('requires authentication', function () {
    $product = Product::factory()->launched()->create();

    $this->postJson("/api/products/{$product->slug}/votes")->assertUnauthorized();
});

it('rejects the founder voting on their own product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/votes")
        ->assertForbidden()
        ->assertJsonPath('message', "You can't vote on your own product.");
});

it('rejects a member with an unverified email', function () {
    $member = User::factory()->unverified()->create();
    $product = Product::factory()->launched()->create();

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/votes")
        ->assertForbidden()
        ->assertJsonPath('message', 'Verify your email before voting.');
});

it('rejects voting on a product that has not launched', function () {
    $member = User::factory()->create();
    $product = Product::factory()->create(['status' => 'approved']);

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/votes")
        ->assertForbidden()
        ->assertJsonPath('message', "This product hasn't launched yet.");
});

it('rejects a second vote from the same member', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    Vote::factory()->create(['product_id' => $product->id, 'user_id' => $member->id]);

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/votes")
        ->assertForbidden()
        ->assertJsonPath('message', 'You already voted on this product.');
});

it('lets a verified member vote on another founder\'s launched product', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();

    $response = $this->actingAs($member)->postJson("/api/products/{$product->slug}/votes");

    $response->assertCreated()
        ->assertJsonPath('data.votes_count', 1)
        ->assertJsonPath('data.voted_by_viewer', true);

    expect(Vote::where('product_id', $product->id)->where('user_id', $member->id)->whereNull('retracted_at')->exists())
        ->toBeTrue();
});

it('lets a member recast a vote after retracting it', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    Vote::factory()->retracted()->create(['product_id' => $product->id, 'user_id' => $member->id]);

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/votes")
        ->assertCreated()
        ->assertJsonPath('data.votes_count', 1);

    expect(Vote::where('product_id', $product->id)->where('user_id', $member->id)->count())->toBe(2);
});
