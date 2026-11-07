<?php

use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use App\Notifications\Comments\NewCommentNotification;
use Illuminate\Support\Facades\Notification;

it('requires authentication', function () {
    $product = Product::factory()->launched()->create();

    $this->postJson("/api/products/{$product->slug}/comments", ['body' => 'Nice work!'])
        ->assertUnauthorized();
});

it('requires a body', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');
});

it('rejects a member with an unverified email', function () {
    $member = User::factory()->unverified()->create();
    $product = Product::factory()->launched()->create();

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", ['body' => 'Nice work!'])
        ->assertForbidden()
        ->assertJsonPath('message', 'Verify your email before commenting.');
});

it('rejects commenting on a product that has not launched', function () {
    $member = User::factory()->create();
    $product = Product::factory()->create(['status' => 'approved']);

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", ['body' => 'Nice work!'])
        ->assertForbidden()
        ->assertJsonPath('message', "This product hasn't launched yet.");
});

it('lets a verified member comment on a launched product', function () {
    Notification::fake();

    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();

    $response = $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", ['body' => 'Nice work!']);

    $response->assertCreated()
        ->assertJsonPath('data.body', 'Nice work!')
        ->assertJsonPath('data.parent_comment_id', null)
        ->assertJsonPath('data.author.id', $member->id);

    expect(Comment::where('product_id', $product->id)->where('user_id', $member->id)->exists())->toBeTrue();
});

it('lets the founder comment on their own product', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/comments", ['body' => 'Thanks for checking it out!'])
        ->assertCreated();
});

it('lets a member reply to a top-level comment', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    $parent = Comment::factory()->create(['product_id' => $product->id]);

    $response = $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", [
        'body' => 'I agree!',
        'parent_comment_id' => $parent->id,
    ]);

    $response->assertCreated()->assertJsonPath('data.parent_comment_id', $parent->id);
});

it('rejects replying to a reply (one level of reply only)', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    $parent = Comment::factory()->create(['product_id' => $product->id]);
    $reply = Comment::factory()->reply($parent)->create();

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", [
        'body' => 'Can\'t do this!',
        'parent_comment_id' => $reply->id,
    ])->assertForbidden()->assertJsonPath('message', "Can't reply to a reply.");
});

it('rejects a parent_comment_id that belongs to another product', function () {
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create();
    $other = Product::factory()->launched()->create();
    $parent = Comment::factory()->create(['product_id' => $other->id]);

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", [
        'body' => 'Wrong thread',
        'parent_comment_id' => $parent->id,
    ])->assertNotFound();
});

it('notifies the founder when someone else comments', function () {
    Notification::fake();

    $founder = User::factory()->create();
    $member = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($member)->postJson("/api/products/{$product->slug}/comments", ['body' => 'Nice work!'])
        ->assertCreated();

    Notification::assertSentTo($founder, NewCommentNotification::class);
});

it('does not notify the founder when they comment on their own product', function () {
    Notification::fake();

    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/comments", ['body' => 'Thanks everyone!'])
        ->assertCreated();

    Notification::assertNothingSent();
});
