<?php

namespace App\Models;

use App\Notifications\Accounts\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailMethods;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'last_name', 'email', 'handle', 'bio', 'avatar'])]
#[Hidden(['password_hash', 'google_id'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, MustVerifyEmailMethods, Notifiable;

    /**
     * Send the email verification notification (overridden to use our
     * auth_tokens-backed flow, see ADR-012, instead of Laravel's signed URL).
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification($this));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_suspended' => 'boolean',
            'password_hash' => 'hashed',
        ];
    }

    /**
     * The password column used for authentication (see docs/04-db-diagram.md).
     */
    public function getAuthPassword(): ?string
    {
        return $this->password_hash;
    }

    /**
     * @return HasMany<UserLink, $this>
     */
    public function links(): HasMany
    {
        return $this->hasMany(UserLink::class);
    }

    /**
     * @return HasMany<AuthToken, $this>
     */
    public function authTokens(): HasMany
    {
        return $this->hasMany(AuthToken::class);
    }

    public function isPasswordAccount(): bool
    {
        return $this->auth_provider === 'password';
    }

    /**
     * `avatar` holds either an S3 key (password/self-uploaded avatars) or a
     * ready-made URL (Google profile photos) — resolve whichever it is.
     */
    public function avatarUrl(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        return Str::startsWith($this->avatar, ['http://', 'https://'])
            ? $this->avatar
            : Storage::disk('s3')->url($this->avatar);
    }

    /**
     * Slugify a name into a unique, unused handle (e.g. "amina" -> "amina-2"
     * if taken) for the public profile URL.
     */
    public static function generateUniqueHandle(string $firstName, string $lastName): string
    {
        $base = Str::slug("{$firstName} {$lastName}") ?: 'member';
        $handle = $base;
        $suffix = 1;

        while (static::query()->where('handle', $handle)->exists()) {
            $suffix++;
            $handle = "{$base}-{$suffix}";
        }

        return $handle;
    }
}
