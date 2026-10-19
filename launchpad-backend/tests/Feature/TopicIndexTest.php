<?php

use App\Models\Topic;

it('lists topics without authentication', function () {
    Topic::create(['name' => 'Productivity', 'slug' => 'productivity']);
    Topic::create(['name' => 'Design', 'slug' => 'design']);

    $response = $this->getJson('/api/topics');

    $response->assertOk()->assertJsonCount(2, 'data');
    expect($response->json('data.0.name'))->toBe('Design');
});
