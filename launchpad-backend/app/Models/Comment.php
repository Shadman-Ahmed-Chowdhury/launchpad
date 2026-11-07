<?php

namespace App\Models;

use Database\Factories\CommentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A comment on a product, or a reply to one (`parent_comment_id` set) — one
 * level of reply only, enforced by `CommentPolicy::reply()`, not here (see
 * docs/01-client-brief.md "Voting and comments"). `SoftDeletes` backs the
 * `deleted_at` column the schema already drafted for a future upheld
 * report, which isn't built yet.
 */
#[Fillable(['product_id', 'user_id', 'parent_comment_id', 'body'])]
class Comment extends Model
{
    /** @use HasFactory<CommentFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Comment, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_comment_id');
    }

    /**
     * Oldest-first, matching conversation order within a thread (the
     * product page's top-level list is newest-first, see
     * `CommentController::index()`).
     *
     * @return HasMany<Comment, $this>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_comment_id')->oldest();
    }

    /**
     * @return HasMany<CommentLike, $this>
     */
    public function likes(): HasMany
    {
        return $this->hasMany(CommentLike::class);
    }

    /**
     * @return HasMany<CommentReport, $this>
     */
    public function reports(): HasMany
    {
        return $this->hasMany(CommentReport::class);
    }
}
