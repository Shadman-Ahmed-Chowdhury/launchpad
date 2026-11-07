<?php

use App\Models\Comment;
use App\Models\CommentReport;
use App\Models\User;

it('requires authentication', function () {
    $comment = Comment::factory()->create();

    $this->postJson("/api/comments/{$comment->id}/reports", ['reason' => 'Spam'])
        ->assertUnauthorized();
});

it('requires a reason', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/reports", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('reason');
});

it('rejects a member with an unverified email', function () {
    $member = User::factory()->unverified()->create();
    $comment = Comment::factory()->create();

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/reports", ['reason' => 'Spam'])
        ->assertForbidden()
        ->assertJsonPath('message', 'Verify your email before reporting a comment.');
});

it('rejects reporting your own comment', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create(['user_id' => $member->id]);

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/reports", ['reason' => 'Spam'])
        ->assertForbidden()
        ->assertJsonPath('message', "You can't report your own comment.");
});

it('lets a verified member report a comment', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();

    $response = $this->actingAs($member)->postJson("/api/comments/{$comment->id}/reports", ['reason' => 'Off-topic spam']);

    $response->assertCreated()
        ->assertJsonPath('data.reported_by_viewer', true);

    expect(CommentReport::query()
        ->where('comment_id', $comment->id)
        ->where('reporter_id', $member->id)
        ->where('reason', 'Off-topic spam')
        ->where('status', 'pending')
        ->exists())->toBeTrue();
});

it('lets a member report a reply', function () {
    $member = User::factory()->create();
    $parent = Comment::factory()->create();
    $reply = Comment::factory()->reply($parent)->create();

    $this->actingAs($member)->postJson("/api/comments/{$reply->id}/reports", ['reason' => 'Abusive'])
        ->assertCreated();
});

it('rejects a second report from the same member', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();
    CommentReport::factory()->create(['comment_id' => $comment->id, 'reporter_id' => $member->id]);

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/reports", ['reason' => 'Again'])
        ->assertForbidden()
        ->assertJsonPath('message', 'You already reported this comment.');
});
