<?php

use App\Models\AuditLog;
use App\Models\User;

it('requires authentication', function () {
    $this->postJson('/api/admin/reviewers', [
        'first_name' => 'Rae',
        'last_name' => 'Okafor',
        'email' => 'rae@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertUnauthorized();
});

it('rejects a plain member', function () {
    $member = User::factory()->create();

    $this->actingAs($member)->postJson('/api/admin/reviewers', [
        'first_name' => 'Rae',
        'last_name' => 'Okafor',
        'email' => 'rae@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertForbidden();
});

it('rejects a reviewer — only an admin can create reviewers', function () {
    $reviewer = User::factory()->reviewer()->create();

    $this->actingAs($reviewer)->postJson('/api/admin/reviewers', [
        'first_name' => 'Rae',
        'last_name' => 'Okafor',
        'email' => 'rae@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertForbidden();
});

it('lets an admin create a reviewer account and records an audit log', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/admin/reviewers', [
        'first_name' => 'Rae',
        'last_name' => 'Okafor',
        'email' => 'rae@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.email', 'rae@example.com')
        ->assertJsonPath('data.role', 'reviewer')
        ->assertJsonPath('data.email_verified', true);

    $reviewer = User::where('email', 'rae@example.com')->first();
    expect($reviewer)->not->toBeNull();
    expect($reviewer->role)->toBe('reviewer');
    expect($reviewer->auth_provider)->toBe('password');
    expect($reviewer->password_hash)->not->toBeNull();

    expect(AuditLog::where('actor_id', $admin->id)
        ->where('action', 'create_reviewer')
        ->where('target_type', 'user')
        ->where('target_id', $reviewer->id)
        ->exists())->toBeTrue();
});

it('rejects a duplicate email', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['email' => 'rae@example.com']);

    $this->actingAs($admin)->postJson('/api/admin/reviewers', [
        'first_name' => 'Rae',
        'last_name' => 'Okafor',
        'email' => 'rae@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rejects a mismatched password confirmation', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/admin/reviewers', [
        'first_name' => 'Rae',
        'last_name' => 'Okafor',
        'email' => 'rae@example.com',
        'password' => 'password123',
        'password_confirmation' => 'nope',
    ])->assertUnprocessable()->assertJsonValidationErrors('password');
});
