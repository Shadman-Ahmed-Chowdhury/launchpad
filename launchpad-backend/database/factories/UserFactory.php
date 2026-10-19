<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstName = fake()->firstName();
        $lastName = fake()->lastName();

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => fake()->unique()->safeEmail(),
            'handle' => Str::slug("{$firstName} {$lastName}").'-'.fake()->unique()->numberBetween(1, 999999),
            'auth_provider' => 'password',
            'password_hash' => static::$password ??= Hash::make('password'),
            'google_id' => null,
            'email_verified_at' => now(),
            'bio' => fake()->sentence(8),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model authenticates via Google (no password).
     */
    public function google(): static
    {
        return $this->state(fn (array $attributes) => [
            'auth_provider' => 'google',
            'password_hash' => null,
            'google_id' => fake()->unique()->numerify('##############'),
        ]);
    }

    /**
     * Indicate that the member has been suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_suspended' => true,
        ]);
    }
}
