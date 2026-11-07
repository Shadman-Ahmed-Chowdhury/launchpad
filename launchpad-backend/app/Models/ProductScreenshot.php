<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * One of a product's up-to-three screenshots (see docs/04-db-diagram.md).
 * There's no `updated_at` column — a screenshot row is replaced, not
 * edited, same reasoning as `ProductReview`.
 */
#[Fillable(['product_id', 'image', 'position'])]
class ProductScreenshot extends Model
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
     * `image` holds an S3 key — resolve it to a URL the same way
     * `Product::logoUrl()` does.
     */
    public function url(): string
    {
        return Str::startsWith($this->image, ['http://', 'https://'])
            ? $this->image
            : Storage::disk(config('filesystems.uploads'))->url($this->image);
    }
}
