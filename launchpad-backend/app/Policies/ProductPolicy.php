<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * A founder can only edit their own product, and not while it's
     * `pending_review` — a reviewer could be looking at it mid-queue (see
     * ADR-025).
     */
    public function update(User $user, Product $product): bool
    {
        return $user->is($product->founder) && $product->status !== 'pending_review';
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
