<?php

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\User;

it('requires a reason', function () {
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create();

    $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/request-changes", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors('notes');
});

it('lets a reviewer send a pending product back for changes', function () {
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create();

    $response = $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/request-changes", [
        'notes' => 'Please add a screenshot.',
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'changes_requested');
    expect($product->refresh()->status)->toBe('changes_requested');

    $this->assertDatabaseHas('product_reviews', [
        'product_id' => $product->id,
        'reviewer_id' => $reviewer->id,
        'action' => 'changes_requested',
        'notes' => 'Please add a screenshot.',
    ]);

    expect(AuditLog::where('actor_id', $reviewer->id)
        ->where('action', 'request_product_changes')
        ->where('target_id', $product->id)
        ->exists())->toBeTrue();
});

it('lets the founder edit and resubmit after changes are requested', function () {
    $founder = User::factory()->create();
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create(['founder_id' => $founder->id]);

    $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/request-changes", [
        'notes' => 'Please add a screenshot.',
    ])->assertOk();

    $this->actingAs($founder)->patchJson("/api/products/{$product->slug}", ['tagline' => 'Updated pitch'])
        ->assertOk()->assertJsonPath('data.tagline', 'Updated pitch');

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/submit")
        ->assertOk()->assertJsonPath('data.status', 'pending_review');
});
