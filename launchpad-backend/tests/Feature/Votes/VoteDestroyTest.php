<?php

use App\Models\Product;
use App\Models\User;
use App\Models\Vote;

it('requires authentication', function () {
    $product = Product::factory()->launched()->create();

    $this->deleteJson("/api/products/{$product->slug}/votes")->assertUnauthorized();
});

it('rejects retracting a vote that does not exist', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();

    $this->actingAs($member)->deleteJson("/api/products/{$product->slug}/votes")
        ->assertForbidden()
        ->assertJsonPath('message', "You haven't voted on this product.");
});

it('rejects retracting someone else\'s vote', function () {
    $voter = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->launched()->create();
    Vote::factory()->create(['product_id' => $product->id, 'user_id' => $voter->id]);

    $this->actingAs($other)->deleteJson("/api/products/{$product->slug}/votes")
        ->assertForbidden()
        ->assertJsonPath('message', "You haven't voted on this product.");
});

it('lets a member take back their own vote', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    $vote = Vote::factory()->create(['product_id' => $product->id, 'user_id' => $member->id]);

    $response = $this->actingAs($member)->deleteJson("/api/products/{$product->slug}/votes");

    $response->assertOk()
        ->assertJsonPath('data.votes_count', 0)
        ->assertJsonPath('data.voted_by_viewer', false);

    expect($vote->refresh()->retracted_at)->not->toBeNull();
});
