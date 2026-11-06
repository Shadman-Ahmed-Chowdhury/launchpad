<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable(['founder_id', 'name', 'slug', 'tagline', 'description', 'logo', 'website_url', 'status', 'launch_date', 'launched_at', 'submitted_at'])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function founder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'founder_id');
    }

    /**
     * @return BelongsToMany<Topic, $this>
     */
    public function topics(): BelongsToMany
    {
        return $this->belongsToMany(Topic::class, 'product_topics');
    }

    /**
     * @return HasMany<Vote, $this>
     */
    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    /**
     * Votes that haven't been retracted — what `votes_count` should always
     * be counted from, and what the vote/unvote policy checks against (see
     * ADR-014, ADR-029).
     *
     * @return HasMany<Vote, $this>
     */
    public function activeVotes(): HasMany
    {
        return $this->hasMany(Vote::class)->whereNull('retracted_at');
    }

    /**
     * @return HasMany<ProductReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    /**
     * The most recent reviewer decision, if any — powers the "told the
     * outcome" founder-facing note on `ProductResource` (see ADR-025).
     *
     * @return HasOne<ProductReview, $this>
     */
    public function latestReview(): HasOne
    {
        return $this->hasOne(ProductReview::class)->latestOfMany();
    }

    /**
     * `logo` holds an S3 key — resolve it to a URL the same way
     * `User::avatarUrl()` does (see docs/04-db-diagram.md).
     */
    public function logoUrl(): ?string
    {
        if (! $this->logo) {
            return null;
        }

        return Str::startsWith($this->logo, ['http://', 'https://'])
            ? $this->logo
            : Storage::disk(config('filesystems.uploads'))->url($this->logo);
    }

    /**
     * Slugify a name into a unique, unused slug (e.g. "FlowCraft" ->
     * "flowcraft-2" if taken), same pattern as User::generateUniqueHandle().
     */
    public static function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 1;

        while (static::query()->where('slug', $slug)->exists()) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
