<?php

use App\Models\Product;
use App\Models\User;

it('requires authentication', function () {
    $product = Product::factory()->create(['status' => 'approved']);

    $this->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => now()->addDay()->toDateString()])
        ->assertUnauthorized();
});

it('rejects a member who is not the founder', function () {
    $founder = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'approved']);

    $this->actingAs($other)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => now()->addDay()->toDateString()])
        ->assertForbidden();
});

it('blocks scheduling a product that has not been approved yet', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'draft']);

    $this->actingAs($founder)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => now()->addDay()->toDateString()])
        ->assertForbidden();
});

it('lets a founder pick a launch day once approved', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'approved']);
    $launchDate = now()->addDays(3)->toDateString();

    $response = $this->actingAs($founder)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => $launchDate]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'scheduled')
        ->assertJsonPath('data.launch_date', $launchDate);
});

it('lets a founder change the day while still scheduled', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->create([
        'founder_id' => $founder->id,
        'status' => 'scheduled',
        'launch_date' => now()->addDays(2)->toDateString(),
    ]);
    $newDate = now()->addDays(5)->toDateString();

    $response = $this->actingAs($founder)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => $newDate]);

    $response->assertOk()->assertJsonPath('data.launch_date', $newDate);
});

it('blocks changing the day once launched', function () {
    $founder = User::factory()->create();
    $product = Product::factory()->launched()->create(['founder_id' => $founder->id]);

    $this->actingAs($founder)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => now()->addDay()->toDateString()])
        ->assertForbidden();
});

it('enforces the daily launch slot cap', function () {
    config(['launchpad.max_launches_per_day' => 2]);
    $launchDate = now()->addDays(4)->toDateString();

    Product::factory()->count(2)->create(['status' => 'scheduled', 'launch_date' => $launchDate]);

    $founder = User::factory()->create();
    $product = Product::factory()->create(['founder_id' => $founder->id, 'status' => 'approved']);

    $response = $this->actingAs($founder)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => $launchDate]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('launch_date');
});

it('does not count the product against its own already-taken slot when rescheduling to the same day', function () {
    config(['launchpad.max_launches_per_day' => 1]);
    $launchDate = now()->addDays(4)->toDateString();

    $founder = User::factory()->create();
    $product = Product::factory()->create([
        'founder_id' => $founder->id,
        'status' => 'scheduled',
        'launch_date' => $launchDate,
    ]);

    $response = $this->actingAs($founder)
        ->postJson("/api/products/{$product->slug}/schedule", ['launch_date' => $launchDate]);

    $response->assertOk();
});
