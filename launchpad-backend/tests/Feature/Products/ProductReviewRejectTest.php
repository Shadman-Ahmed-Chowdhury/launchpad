<?php

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\User;

it('requires a reason', function () {
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create();

    $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/reject", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors('notes');
});

it('lets a reviewer reject a pending product with a reason', function () {
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create();

    $response = $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/reject", [
        'notes' => 'Website link is dead.',
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'rejected');
    expect($product->refresh()->status)->toBe('rejected');

    $this->assertDatabaseHas('product_reviews', [
        'product_id' => $product->id,
        'reviewer_id' => $reviewer->id,
        'action' => 'rejected',
        'notes' => 'Website link is dead.',
    ]);

    expect(AuditLog::where('actor_id', $reviewer->id)
        ->where('action', 'reject_product')
        ->where('target_id', $product->id)
        ->exists())->toBeTrue();
});

it('is terminal — the founder cannot resubmit a rejected product', function () {
    $founder = User::factory()->create();
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create(['founder_id' => $founder->id]);

    $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/reject", [
        'notes' => 'Not a fit for launch.',
    ])->assertOk();

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/submit")->assertForbidden();
});
