<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'founder_id' => User::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'tagline' => fake()->sentence(6),
            'description' => fake()->paragraph(4),
            'logo' => null,
            'website_url' => fake()->url(),
            'status' => 'draft',
            'launch_date' => null,
            'launched_at' => null,
            'is_featured' => false,
        ];
    }

    /**
     * Indicate that the product has launched.
     */
    public function launched(?string $launchDate = null): static
    {
        $launchDate ??= now()->toDateString();

        return $this->state(fn (array $attributes) => [
            'status' => 'launched',
            'launch_date' => $launchDate,
            'launched_at' => $launchDate,
        ]);
    }
}
