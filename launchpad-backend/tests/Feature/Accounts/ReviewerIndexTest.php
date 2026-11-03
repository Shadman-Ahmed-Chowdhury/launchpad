<?php

use App\Models\User;

it('requires authentication', function () {
    $this->getJson('/api/admin/reviewers')->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();

    $this->actingAs($member)->getJson('/api/admin/reviewers')->assertForbidden();
});

it('rejects a reviewer', function () {
    $reviewer = User::factory()->reviewer()->create();

    $this->actingAs($reviewer)->getJson('/api/admin/reviewers')->assertForbidden();
});

it('lists only reviewers for an admin', function () {
    $admin = User::factory()->admin()->create();
    $reviewer = User::factory()->reviewer()->create();
    User::factory()->create(); // a plain member, shouldn't appear

    $response = $this->actingAs($admin)->getJson('/api/admin/reviewers');

    $response->assertOk();
    expect($response->json('data.*.email'))->toBe([$reviewer->email]);
});
