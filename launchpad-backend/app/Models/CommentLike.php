<?php

namespace App\Models;

use Database\Factories\CommentLikeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A member's like on a comment or reply — plain unique per (comment, user),
 * hard-deleted on unlike (unlike `Vote`, there's no anti-fraud reason to
 * keep a like/unlike history around, see ADR-038).
 */
#[Fillable(['comment_id', 'user_id'])]
class CommentLike extends Model
{
    /** @use HasFactory<CommentLikeFactory> */
    use HasFactory;

    const UPDATED_AT = null;

    /**
     * @return BelongsTo<Comment, $this>
     */
    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
