<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An immutable record of one reviewer decision on a product (see
 * docs/04-db-diagram.md). There's no `updated_at` column — a review is
 * never edited after it's written.
 */
#[Fillable(['product_id', 'reviewer_id', 'action', 'notes'])]
class ProductReview extends Model
{
    const UPDATED_AT = null;

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
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
