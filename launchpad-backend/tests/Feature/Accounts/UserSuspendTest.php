<?php

use App\Models\AuditLog;
use App\Models\User;

it('requires authentication', function () {
    $member = User::factory()->create();

    $this->postJson("/api/admin/users/{$member->id}/suspend")->assertUnauthorized();
});

it('rejects a reviewer suspending a member', function () {
    $reviewer = User::factory()->reviewer()->create();
    $member = User::factory()->create();

    $this->actingAs($reviewer)->postJson("/api/admin/users/{$member->id}/suspend")->assertForbidden();
});

it('lets an admin suspend a member and logs it', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    $response = $this->actingAs($admin)->postJson("/api/admin/users/{$member->id}/suspend");

    $response->assertOk()->assertJsonPath('data.is_suspended', true);
    expect($member->refresh()->is_suspended)->toBeTrue();
    expect(AuditLog::where('action', 'suspend_user')->where('target_id', $member->id)->exists())->toBeTrue();
});

it('lets an admin unsuspend a member', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->suspended()->create();

    $response = $this->actingAs($admin)->postJson("/api/admin/users/{$member->id}/unsuspend");

    $response->assertOk()->assertJsonPath('data.is_suspended', false);
    expect($member->refresh()->is_suspended)->toBeFalse();
});

it('blocks an admin from suspending another staff account', function () {
    $admin = User::factory()->admin()->create();
    $reviewer = User::factory()->reviewer()->create();

    $this->actingAs($admin)->postJson("/api/admin/users/{$reviewer->id}/suspend")->assertForbidden();
});

it('blocks an admin from suspending themselves', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/admin/users/{$admin->id}/suspend")->assertForbidden();
});
