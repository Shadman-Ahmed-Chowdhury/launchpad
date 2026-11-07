<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'user_id' => User::factory(),
            'parent_comment_id' => null,
            'body' => fake()->paragraph(2),
        ];
    }

    /**
     * A reply to another comment — the caller is responsible for making
     * sure the parent is itself top-level (see `CommentPolicy::reply()`).
     */
    public function reply(Comment $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $parent->product_id,
            'parent_comment_id' => $parent->id,
        ]);
    }
}
