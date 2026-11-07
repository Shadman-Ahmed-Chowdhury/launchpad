<?php

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Product;
use App\Models\User;

it('requires authentication to like', function () {
    $comment = Comment::factory()->create();

    $this->postJson("/api/comments/{$comment->id}/likes")->assertUnauthorized();
});

it('rejects a member with an unverified email', function () {
    $member = User::factory()->unverified()->create();
    $comment = Comment::factory()->create();

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/likes")
        ->assertForbidden()
        ->assertJsonPath('message', 'Verify your email before liking a comment.');
});

it('lets a verified member like a comment', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();

    $response = $this->actingAs($member)->postJson("/api/comments/{$comment->id}/likes");

    $response->assertCreated()
        ->assertJsonPath('data.likes_count', 1)
        ->assertJsonPath('data.liked_by_viewer', true);

    expect(CommentLike::where('comment_id', $comment->id)->where('user_id', $member->id)->exists())->toBeTrue();
});

it('lets a member like a reply', function () {
    $member = User::factory()->create();
    $parent = Comment::factory()->create();
    $reply = Comment::factory()->reply($parent)->create();

    $this->actingAs($member)->postJson("/api/comments/{$reply->id}/likes")
        ->assertCreated()
        ->assertJsonPath('data.likes_count', 1);
});

it('lets a member like their own comment', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create(['user_id' => $member->id]);

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/likes")->assertCreated();
});

it('rejects a second like from the same member', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();
    CommentLike::factory()->create(['comment_id' => $comment->id, 'user_id' => $member->id]);

    $this->actingAs($member)->postJson("/api/comments/{$comment->id}/likes")
        ->assertForbidden()
        ->assertJsonPath('message', 'You already liked this comment.');
});

it('requires authentication to unlike', function () {
    $comment = Comment::factory()->create();

    $this->deleteJson("/api/comments/{$comment->id}/likes")->assertUnauthorized();
});

it('rejects unliking a comment the member never liked', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();

    $this->actingAs($member)->deleteJson("/api/comments/{$comment->id}/likes")
        ->assertForbidden()
        ->assertJsonPath('message', "You haven't liked this comment.");
});

it('lets a member take back their own like', function () {
    $member = User::factory()->create();
    $comment = Comment::factory()->create();
    CommentLike::factory()->create(['comment_id' => $comment->id, 'user_id' => $member->id]);

    $response = $this->actingAs($member)->deleteJson("/api/comments/{$comment->id}/likes");

    $response->assertOk()
        ->assertJsonPath('data.likes_count', 0)
        ->assertJsonPath('data.liked_by_viewer', false);

    expect(CommentLike::where('comment_id', $comment->id)->where('user_id', $member->id)->exists())->toBeFalse();
});

it('includes likes_count and liked_by_viewer when listing comments', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    $comment = Comment::factory()->create(['product_id' => $product->id]);
    CommentLike::factory()->create(['comment_id' => $comment->id, 'user_id' => $member->id]);

    $response = $this->actingAs($member)->getJson("/api/products/{$product->slug}/comments");

    $response->assertOk()
        ->assertJsonPath('data.0.likes_count', 1)
        ->assertJsonPath('data.0.liked_by_viewer', true);
});
