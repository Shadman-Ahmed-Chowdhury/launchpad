<?php

use App\Models\AuditLog;
use App\Models\User;

it('requires authentication', function () {
    $reviewer = User::factory()->reviewer()->create();

    $this->deleteJson("/api/admin/reviewers/{$reviewer->id}")->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();
    $reviewer = User::factory()->reviewer()->create();

    $this->actingAs($member)->deleteJson("/api/admin/reviewers/{$reviewer->id}")->assertForbidden();
});

it('revokes reviewer access instead of deleting the account', function () {
    $admin = User::factory()->admin()->create();
    $reviewer = User::factory()->reviewer()->create();

    $response = $this->actingAs($admin)->deleteJson("/api/admin/reviewers/{$reviewer->id}");

    $response->assertOk();
    expect(User::find($reviewer->id))->not->toBeNull();
    expect($reviewer->refresh()->role)->toBe('member');
    expect(AuditLog::where('action', 'revoke_reviewer')->where('target_id', $reviewer->id)->exists())->toBeTrue();
});

it('404s for a user id that is not a reviewer', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    $this->actingAs($admin)->deleteJson("/api/admin/reviewers/{$member->id}")->assertNotFound();
});
