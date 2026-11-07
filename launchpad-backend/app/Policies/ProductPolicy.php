<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProductPolicy
{
    /**
     * A founder can only edit their own product, and only from a status
     * that actually has an edit flow (see docs/02-features.md, ADR-035):
     * `draft`/`changes_requested`/`pending_review` (full edit, no status
     * effect), `approved`/`scheduled` (full edit, but it sends the product
     * back for review — see `ProductController::update()`), or `launched`
     * (description/website only). Not `rejected`/`taken_down`, which are
     * terminal.
     */
    public function update(User $user, Product $product): bool
    {
        return $user->is($product->founder)
            && in_array($product->status, ['draft', 'changes_requested', 'pending_review', 'approved', 'scheduled', 'launched'], true);
    }

    /**
     * Gates the dedicated add/remove screenshot endpoints (ADR-036) — same
     * founder-owned statuses as `update()` minus `launched`, where
     * screenshots are locked outright rather than silently ignored (unlike
     * `update()`, a dedicated screenshot endpoint should say so, not no-op).
     */
    public function manageScreenshots(User $user, Product $product): Response
    {
        if (! $user->is($product->founder)) {
            return Response::deny('This is not your product.');
        }

        if ($product->status === 'launched') {
            return Response::deny("Screenshots can't change once a product has launched.");
        }

        if (! in_array($product->status, ['draft', 'changes_requested', 'pending_review', 'approved', 'scheduled'], true)) {
            return Response::deny("This product can't be edited right now.");
        }

        return Response::allow();
    }

    /**
     * A founder can only delete their own product, and only while it's still
     * a draft — nothing public should disappear via self-service deletion;
     * taking down a live product is a staff action (see docs/02-features.md),
     * not in scope here.
     */
    public function delete(User $user, Product $product): bool
    {
        return $user->is($product->founder) && $product->status === 'draft';
    }

    /**
     * A founder can submit their own product for review from `draft`, or
     * resubmit after `changes_requested` — not from any other status (see
     * ADR-025's status machine).
     */
    public function submit(User $user, Product $product): bool
    {
        return $user->is($product->founder)
            && in_array($product->status, ['draft', 'changes_requested'], true);
    }

    /**
     * A founder can pick a launch day once their product is `approved`, and
     * change it again while it's `scheduled` — not before approval, and not
     * once it has actually `launched` (see docs/02-features.md, ADR-027).
     */
    public function schedule(User $user, Product $product): bool
    {
        return $user->is($product->founder)
            && in_array($product->status, ['approved', 'scheduled'], true);
    }

    /**
     * A member can vote once a product is `launched`, not on their own
     * product, only once their email is verified (ADR-010/020), and only
     * while they don't already have an active vote on it (see
     * docs/01-client-brief.md "Voting and comments"). Each branch denies
     * with its own message (via `Response::deny()`) instead of a generic
     * "This action is unauthorized." — the frontend shows it as-is.
     */
    public function vote(User $user, Product $product): Response
    {
        if ($user->is($product->founder)) {
            return Response::deny("You can't vote on your own product.");
        }

        if ($product->status !== 'launched') {
            return Response::deny("This product hasn't launched yet.");
        }

        if (! $user->hasVerifiedEmail()) {
            return Response::deny('Verify your email before voting.');
        }

        if ($product->activeVotes()->where('user_id', $user->id)->exists()) {
            return Response::deny('You already voted on this product.');
        }

        return Response::allow();
    }

    /**
     * A member can only take back their own active vote.
     */
    public function unvote(User $user, Product $product): Response
    {
        if (! $product->activeVotes()->where('user_id', $user->id)->exists()) {
            return Response::deny("You haven't voted on this product.");
        }

        return Response::allow();
    }

    /**
     * Gates the reviewer queue listing — any staff member (reviewer or
     * admin) can see it.
     */
    public function reviewAny(User $user): bool
    {
        return $user->isStaff();
    }

    /**
     * Gates approve/reject/request-changes — staff only, and only while the
     * product is actually waiting in the queue.
     */
    public function review(User $user, Product $product): bool
    {
        return $user->isStaff() && $product->status === 'pending_review';
    }
}
