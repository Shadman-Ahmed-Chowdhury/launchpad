<?php

use App\Models\Product;
use App\Models\Topic;
use App\Models\User;

it('requires authentication', function () {
    $this->postJson('/api/products', ['name' => 'FlowCraft'])->assertUnauthorized();
});

it('lets an authenticated member create a draft product', function () {
    $user = User::factory()->create();
    $topic = Topic::create(['name' => 'Productivity', 'slug' => 'productivity']);

    $response = $this->actingAs($user)->postJson('/api/products', [
        'name' => 'FlowCraft',
        'tagline' => 'Visual workflows for small teams',
        'description' => 'A longer description of the product.',
        'website_url' => 'https://example.com/flowcraft',
        'topic_ids' => [$topic->id],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'FlowCraft')
        ->assertJsonPath('data.slug', 'flowcraft')
        ->assertJsonPath('data.votes_count', 0)
        ->assertJsonPath('data.topics.0', 'Productivity');

    $product = Product::where('slug', 'flowcraft')->first();
    expect($product)->not->toBeNull();
    expect($product->founder_id)->toBe($user->id);
    expect($product->status)->toBe('draft');
});

it('rejects more than three topics', function () {
    $user = User::factory()->create();
    $topicIds = collect(['one', 'two', 'three', 'four'])
        ->map(fn (string $slug) => Topic::create(['name' => $slug, 'slug' => $slug])->id)
        ->all();

    $response = $this->actingAs($user)->postJson('/api/products', [
        'name' => 'FlowCraft',
        'tagline' => 'Visual workflows for small teams',
        'description' => 'A longer description of the product.',
        'website_url' => 'https://example.com/flowcraft',
        'topic_ids' => $topicIds,
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('topic_ids');
});

it('ignores a client-supplied status — every product starts as a draft', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/products', [
        'name' => 'FlowCraft',
        'tagline' => 'Visual workflows for small teams',
        'description' => 'A longer description of the product.',
        'website_url' => 'https://example.com/flowcraft',
        'status' => 'launched',
    ]);

    $response->assertCreated();
    expect(Product::where('slug', 'flowcraft')->first()->status)->toBe('draft');
});
