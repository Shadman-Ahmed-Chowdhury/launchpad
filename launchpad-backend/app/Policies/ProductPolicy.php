<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * A founder can only edit their own product.
     */
    public function update(User $user, Product $product): bool
    {
        return $user->is($product->founder);
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
}
