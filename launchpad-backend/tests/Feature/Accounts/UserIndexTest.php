<?php

use App\Models\User;

it('requires authentication', function () {
    $this->getJson('/api/admin/users')->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();

    $this->actingAs($member)->getJson('/api/admin/users')->assertForbidden();
});

it('rejects a reviewer', function () {
    $reviewer = User::factory()->reviewer()->create();

    $this->actingAs($reviewer)->getJson('/api/admin/users')->assertForbidden();
});

it('lists only plain members for an admin', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();
    User::factory()->reviewer()->create(); // staff, shouldn't appear

    $response = $this->actingAs($admin)->getJson('/api/admin/users');

    $response->assertOk();
    expect($response->json('data.*.email'))->toBe([$member->email]);
});
