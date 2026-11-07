<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CommentPolicy
{
    /**
     * A member can comment on a product once it's `launched` (same gating
     * as voting — a draft/pending product has no public audience to
     * comment, see `ProductPolicy::vote()`), and only once their email is
     * verified (ADR-010/020, see docs/01-client-brief.md "Voting and
     * comments"). Unlike voting, the founder can comment on their own
     * product.
     */
    public function create(User $user, Product $product): Response
    {
        if ($product->status !== 'launched') {
            return Response::deny("This product hasn't launched yet.");
        }

        if (! $user->hasVerifiedEmail()) {
            return Response::deny('Verify your email before commenting.');
        }

        return Response::allow();
    }

    /**
     * A reply follows the same two product-level checks as `create()`, plus
     * one more: the comment being replied to must itself be top-level — one
     * level of reply only (see docs/01-client-brief.md "Voting and
     * comments"). Enforced here, not just in the UI.
     */
    public function reply(User $user, Comment $parent): Response
    {
        $productCheck = $this->create($user, $parent->product);

        if ($productCheck->denied()) {
            return $productCheck;
        }

        if ($parent->parent_comment_id !== null) {
            return Response::deny("Can't reply to a reply.");
        }

        return Response::allow();
    }

    /**
     * A member can like any comment or reply once their email is verified
     * (ADR-010/020, same posture as `create()`) — unlike voting, liking
     * your own comment isn't disallowed (low-stakes, no ranking it could
     * skew, see ADR-038).
     */
    public function like(User $user, Comment $comment): Response
    {
        if (! $user->hasVerifiedEmail()) {
            return Response::deny('Verify your email before liking a comment.');
        }

        if ($comment->likes()->where('user_id', $user->id)->exists()) {
            return Response::deny('You already liked this comment.');
        }

        return Response::allow();
    }

    /**
     * A member can only take back their own like.
     */
    public function unlike(User $user, Comment $comment): Response
    {
        if (! $comment->likes()->where('user_id', $user->id)->exists()) {
            return Response::deny("You haven't liked this comment.");
        }

        return Response::allow();
    }

    /**
     * A member can report any comment or reply but their own, once per
     * comment, once their email is verified (same posture as `create()`,
     * see docs/01-client-brief.md "Members can report a comment").
     */
    public function report(User $user, Comment $comment): Response
    {
        if (! $user->hasVerifiedEmail()) {
            return Response::deny('Verify your email before reporting a comment.');
        }

        if ($user->is($comment->user)) {
            return Response::deny("You can't report your own comment.");
        }

        if ($comment->reports()->where('reporter_id', $user->id)->exists()) {
            return Response::deny('You already reported this comment.');
        }

        return Response::allow();
    }
}
