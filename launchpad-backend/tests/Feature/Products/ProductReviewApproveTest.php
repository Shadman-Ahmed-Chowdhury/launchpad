<?php

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $product = Product::factory()->pendingReview()->create();

    $this->postJson("/api/reviewer/products/{$product->slug}/approve")->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();
    $product = Product::factory()->pendingReview()->create();

    $this->actingAs($member)->postJson("/api/reviewer/products/{$product->slug}/approve")->assertForbidden();
});

it('rejects approving a product that is not pending review', function () {
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->create(['status' => 'draft']);

    $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/approve")->assertForbidden();
});

it('lets a reviewer approve a pending product and records a review + audit log', function () {
    $reviewer = User::factory()->reviewer()->create();
    $product = Product::factory()->pendingReview()->create();

    $response = $this->actingAs($reviewer)->postJson("/api/reviewer/products/{$product->slug}/approve");

    $response->assertOk()->assertJsonPath('data.status', 'approved');
    expect($product->refresh()->status)->toBe('approved');

    $this->assertDatabaseHas('product_reviews', [
        'product_id' => $product->id,
        'reviewer_id' => $reviewer->id,
        'action' => 'approved',
    ]);

    expect(AuditLog::where('actor_id', $reviewer->id)
        ->where('action', 'approve_product')
        ->where('target_type', 'product')
        ->where('target_id', $product->id)
        ->exists())->toBeTrue();
});
