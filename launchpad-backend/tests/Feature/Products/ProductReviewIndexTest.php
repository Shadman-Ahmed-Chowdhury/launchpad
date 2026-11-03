<?php

use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $this->getJson('/api/reviewer/products')->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();

    $this->actingAs($member)->getJson('/api/reviewer/products')->assertForbidden();
});

it('lists only pending_review products, oldest submission first, for a reviewer', function () {
    $reviewer = User::factory()->reviewer()->create();

    $old = Product::factory()->pendingReview()->create(['submitted_at' => now()->subDays(2)]);
    $new = Product::factory()->pendingReview()->create(['submitted_at' => now()->subDay()]);
    Product::factory()->create(['status' => 'draft']);
    Product::factory()->launched()->create();

    $response = $this->actingAs($reviewer)->getJson('/api/reviewer/products');

    $response->assertOk();
    expect($response->json('data.*.slug'))->toBe([$old->slug, $new->slug]);
});

it('is also accessible to an admin', function () {
    $admin = User::factory()->admin()->create();
    Product::factory()->pendingReview()->create();

    $this->actingAs($admin)->getJson('/api/reviewer/products')->assertOk();
});
