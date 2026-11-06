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
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'founder_id');
    }

    /**
     * This member's products that are actually public — what the public
     * profile page lists (see ADR-031), same `launched`-only visibility
     * `ProductController::index()` uses for the front page.
     *
     * @return HasMany<Product, $this>
     */
    public function launchedProducts(): HasMany
    {
        return $this->products()->where('status', 'launched');
    }

    /**
     * Active votes across this member's launched products — the "upvotes
     * received" stat on the public profile (see ADR-031).
     */
    public function votesReceivedCount(): int
    {
        return Vote::whereNull('retracted_at')
            ->whereHas('product', fn ($query) => $query->where('founder_id', $this->id)->where('status', 'launched'))
            ->count();
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

    public function isReviewer(): bool
    {
        return $this->role === 'reviewer';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Reviewer or admin — the two staff roles that can access the review
     * queue (see docs/02-features.md).
     */
    public function isStaff(): bool
    {
        return $this->isReviewer() || $this->isAdmin();
    }

    /**
     * `avatar` holds either an uploads-disk key (password/self-uploaded
     * avatars — see config('filesystems.uploads'), ADR-032) or a ready-made
     * URL (Google profile photos) — resolve whichever it is.
     */
    public function avatarUrl(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        return Str::startsWith($this->avatar, ['http://', 'https://'])
            ? $this->avatar
            : Storage::disk(config('filesystems.uploads'))->url($this->avatar);
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
