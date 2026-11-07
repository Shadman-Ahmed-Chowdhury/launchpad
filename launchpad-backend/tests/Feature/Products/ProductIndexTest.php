<?php

use App\Models\Product;
use App\Models\Topic;
use App\Models\Vote;

it('lists only launched products, most-voted first', function () {
    $launchedHigh = Product::factory()->launched()->create();
    $launchedLow = Product::factory()->launched()->create();
    Product::factory()->create(['status' => 'draft']);

    Vote::factory()->count(3)->create(['product_id' => $launchedHigh->id]);
    Vote::factory()->count(1)->create(['product_id' => $launchedLow->id]);

    $response = $this->getJson('/api/products');

    $response->assertOk()->assertJsonCount(2, 'data');
    expect($response->json('data.0.id'))->toBe($launchedHigh->id);
    expect($response->json('data.0.votes_count'))->toBe(3);
    expect($response->json('data.1.id'))->toBe($launchedLow->id);
});

it('includes pagination metadata', function () {
    Product::factory()->count(2)->launched()->create();

    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonStructure(['data', 'links', 'meta']);
});

it('includes the founder on each product, so the frontend can tell an owner apart from any other viewer', function () {
    $product = Product::factory()->launched()->create();

    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonPath('data.0.founder.id', $product->founder_id);
});

it('searches by name', function () {
    $match = Product::factory()->launched()->create(['name' => 'FlowCraft']);
    Product::factory()->launched()->create(['name' => 'Something Else']);

    $this->getJson('/api/products?q=FlowCraft')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $match->id);
});

it('searches by tagline or description, not just the name', function () {
    $match = Product::factory()->launched()->create([
        'name' => 'FlowCraft',
        'tagline' => 'Automate your invoicing in minutes',
        'description' => 'A tool for freelancers.',
    ]);
    Product::factory()->launched()->create([
        'name' => 'Other Thing',
        'tagline' => 'Something unrelated',
        'description' => 'A tool for scheduling meetings.',
    ]);

    $this->getJson('/api/products?q=invoicing')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $match->id);
});

it('returns an empty list when the search term matches nothing', function () {
    Product::factory()->launched()->create(['name' => 'FlowCraft']);

    $this->getJson('/api/products?q=zzzznomatch')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('filters by a single topic slug', function () {
    $productivity = Topic::create(['name' => 'Productivity', 'slug' => 'productivity']);
    $design = Topic::create(['name' => 'Design', 'slug' => 'design']);

    $match = Product::factory()->launched()->create();
    $match->topics()->attach($productivity);

    $other = Product::factory()->launched()->create();
    $other->topics()->attach($design);

    $this->getJson('/api/products?topics=productivity')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $match->id);
});

it('filters by multiple topic slugs, OR-matched (see ADR-040)', function () {
    $productivity = Topic::create(['name' => 'Productivity', 'slug' => 'productivity']);
    $design = Topic::create(['name' => 'Design', 'slug' => 'design']);
    $writing = Topic::create(['name' => 'Writing', 'slug' => 'writing']);

    $productivityProduct = Product::factory()->launched()->create();
    $productivityProduct->topics()->attach($productivity);

    $designProduct = Product::factory()->launched()->create();
    $designProduct->topics()->attach($design);

    $writingProduct = Product::factory()->launched()->create();
    $writingProduct->topics()->attach($writing);

    $this->getJson('/api/products?topics=productivity,design')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['id' => $productivityProduct->id])
        ->assertJsonFragment(['id' => $designProduct->id]);
});

it('filters by launch date range', function () {
    $tooEarly = Product::factory()->launched('2026-10-01')->create();
    $inRange = Product::factory()->launched('2026-10-15')->create();
    $tooLate = Product::factory()->launched('2026-11-01')->create();

    $this->getJson('/api/products?from=2026-10-10&to=2026-10-20')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $inRange->id);
});

it('rejects a date range where "to" is before "from"', function () {
    $this->getJson('/api/products?from=2026-10-20&to=2026-10-10')
        ->assertStatus(422)
        ->assertJsonValidationErrors('to');
});

it('sorts by newest when sort=newest', function () {
    $older = Product::factory()->launched('2026-10-01')->create();
    $newer = Product::factory()->launched('2026-11-05')->create();

    // Give the older product more votes, so this test actually proves
    // sort=newest overrides the default votes-count ordering.
    Vote::factory()->count(5)->create(['product_id' => $older->id]);

    $this->getJson('/api/products?sort=newest')
        ->assertOk()
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.1.id', $older->id);
});

it('combines search, topic filter, and sort together', function () {
    $productivity = Topic::create(['name' => 'Productivity', 'slug' => 'productivity']);

    $match = Product::factory()->launched('2026-11-05')->create(['name' => 'FlowCraft']);
    $match->topics()->attach($productivity);

    // Right name, wrong topic.
    $wrongTopic = Product::factory()->launched('2026-11-06')->create(['name' => 'FlowCraft Two']);

    // Right topic, wrong name.
    $wrongName = Product::factory()->launched('2026-11-07')->create();
    $wrongName->topics()->attach($productivity);

    $this->getJson('/api/products?q=FlowCraft&topics=productivity&sort=newest')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $match->id);
});

it('rejects an invalid sort value', function () {
    $this->getJson('/api/products?sort=not-a-real-sort')
        ->assertStatus(422)
        ->assertJsonValidationErrors('sort');
});
