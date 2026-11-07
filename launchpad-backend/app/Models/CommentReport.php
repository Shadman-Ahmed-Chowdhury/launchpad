<?php

namespace App\Models;

use Database\Factories\CommentReportFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A member's report on a comment or reply (see docs/01-client-brief.md
 * "Voting and comments"). `status`/`resolved_by`/`resolved_at` are written
 * by the (not-yet-built) reviewer queue — this model only covers a member
 * filing the report, see ADR-038.
 */
#[Fillable(['comment_id', 'reporter_id', 'reason'])]
class CommentReport extends Model
{
    /** @use HasFactory<CommentReportFactory> */
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
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
