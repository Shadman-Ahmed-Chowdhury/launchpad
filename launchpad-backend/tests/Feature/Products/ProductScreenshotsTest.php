<?php

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('uploads up to three screenshots when creating a product', function () {
    Storage::fake(config('filesystems.uploads'));
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/products', [
        'name' => 'FlowCraft',
        'tagline' => 'Visual workflows for small teams',
        'description' => 'A longer description of the product.',
        'website_url' => 'https://example.com/flowcraft',
        'screenshots' => [
            UploadedFile::fake()->image('one.jpg'),
            UploadedFile::fake()->image('two.jpg'),
        ],
    ]);

    $response->assertCreated();
    expect($response->json('data.screenshots'))->toHaveCount(2);

    $product = Product::where('slug', 'flowcraft')->first();
    expect($product->screenshots)->toHaveCount(2);
    Storage::disk(config('filesystems.uploads'))->assertExists($product->screenshots->first()->image);
});

it('rejects a fourth screenshot at creation', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/products', [
        'name' => 'FlowCraft',
        'tagline' => 'Visual workflows for small teams',
        'description' => 'A longer description of the product.',
        'website_url' => 'https://example.com/flowcraft',
        'screenshots' => [
            UploadedFile::fake()->image('one.jpg'),
            UploadedFile::fake()->image('two.jpg'),
            UploadedFile::fake()->image('three.jpg'),
            UploadedFile::fake()->image('four.jpg'),
        ],
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('screenshots');
});

it('requires authentication to add a screenshot', function () {
    $product = Product::factory()->create();

    $this->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('one.jpg')],
    ])->assertUnauthorized();
});

it('rejects a member who is not the founder', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $this->actingAs($other)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('one.jpg')],
    ])->assertForbidden();
});

it('lets a founder append screenshots one at a time, keeping upload order', function () {
    Storage::fake(config('filesystems.uploads'));
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('first.jpg')],
    ])->assertOk();

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('second.jpg')],
    ])->assertOk();

    expect($product->refresh()->screenshots)->toHaveCount(2);
    expect($product->screenshots->pluck('position')->all())->toBe([0, 1]);
});

it('rejects adding a screenshot once the product already has three', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    $product->screenshots()->createMany([
        ['image' => 'product-screenshots/a.jpg', 'position' => 0],
        ['image' => 'product-screenshots/b.jpg', 'position' => 1],
        ['image' => 'product-screenshots/c.jpg', 'position' => 2],
    ]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('four.jpg')],
    ])->assertUnprocessable()->assertJsonValidationErrors('screenshots');
});

it('rejects two screenshots that would push the total over three', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    $product->screenshots()->createMany([
        ['image' => 'product-screenshots/a.jpg', 'position' => 0],
        ['image' => 'product-screenshots/b.jpg', 'position' => 1],
    ]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('two.jpg'), UploadedFile::fake()->image('three.jpg')],
    ])->assertUnprocessable()->assertJsonValidationErrors('screenshots');

    expect($product->refresh()->screenshots)->toHaveCount(2);
});

it('does not let a founder add a screenshot once launched', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('new.jpg')],
    ])->assertForbidden();
});

it('sends an approved product back to review when a screenshot is added', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'approved']);

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('new.jpg')],
    ])->assertOk()->assertJsonPath('data.status', 'pending_review');

    expect($product->refresh())->status->toBe('pending_review')->submitted_at->not->toBeNull();
});

it('lets a founder remove a screenshot and closes the position gap', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    $shots = $product->screenshots()->createMany([
        ['image' => 'product-screenshots/a.jpg', 'position' => 0],
        ['image' => 'product-screenshots/b.jpg', 'position' => 1],
        ['image' => 'product-screenshots/c.jpg', 'position' => 2],
    ]);

    $response = $this->actingAs($founder)->deleteJson("/api/products/{$product->slug}/screenshots/{$shots[0]->id}");

    $response->assertOk();
    $remaining = $product->refresh()->screenshots;
    expect($remaining)->toHaveCount(2);
    expect($remaining->pluck('image')->all())->toBe(['product-screenshots/b.jpg', 'product-screenshots/c.jpg']);
    expect($remaining->pluck('position')->all())->toBe([0, 1]);
});

it('lets a founder add another screenshot after removing one', function () {
    Storage::fake(config('filesystems.uploads'));
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    $shots = $product->screenshots()->createMany([
        ['image' => 'product-screenshots/a.jpg', 'position' => 0],
        ['image' => 'product-screenshots/b.jpg', 'position' => 1],
        ['image' => 'product-screenshots/c.jpg', 'position' => 2],
    ]);

    $this->actingAs($founder)->deleteJson("/api/products/{$product->slug}/screenshots/{$shots[0]->id}")->assertOk();

    $this->actingAs($founder)->postJson("/api/products/{$product->slug}/screenshots", [
        'screenshots' => [UploadedFile::fake()->image('fresh.jpg')],
    ])->assertOk();

    expect($product->refresh()->screenshots)->toHaveCount(3);
});

it('rejects a member who is not the founder from removing a screenshot', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);
    $shot = $product->screenshots()->create(['image' => 'product-screenshots/a.jpg', 'position' => 0]);

    $this->actingAs($other)->deleteJson("/api/products/{$product->slug}/screenshots/{$shot->id}")
        ->assertForbidden();
});

it('does not let a founder remove a screenshot once launched', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);
    $shot = $product->screenshots()->create(['image' => 'product-screenshots/a.jpg', 'position' => 0]);

    $this->actingAs($founder)->deleteJson("/api/products/{$product->slug}/screenshots/{$shot->id}")
        ->assertForbidden();

    expect($product->screenshots)->toHaveCount(1);
});
