<?php

use App\Models\User;

it('requires authentication', function () {
    $reviewer = User::factory()->reviewer()->create();

    $this->patchJson("/api/admin/reviewers/{$reviewer->id}", ['first_name' => 'New'])
        ->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();
    $reviewer = User::factory()->reviewer()->create();

    $this->actingAs($member)
        ->patchJson("/api/admin/reviewers/{$reviewer->id}", ['first_name' => 'New'])
        ->assertForbidden();
});

it('lets an admin edit a reviewer', function () {
    $admin = User::factory()->admin()->create();
    $reviewer = User::factory()->reviewer()->create(['first_name' => 'Old']);

    $response = $this->actingAs($admin)
        ->patchJson("/api/admin/reviewers/{$reviewer->id}", ['first_name' => 'New']);

    $response->assertOk()->assertJsonPath('data.first_name', 'New');
    expect($reviewer->refresh()->first_name)->toBe('New');
});

it('404s for a user id that is not a reviewer', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/reviewers/{$member->id}", ['first_name' => 'New'])
        ->assertNotFound();
});
