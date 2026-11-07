<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\ReviewProductRequest;
use App\Http\Resources\Products\ProductResource;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/**
 * Staff (reviewer/admin) decisions on a product waiting in the queue — see
 * ADR-025. Every decision writes a `ProductReview` (shown to the founder)
 * and an `AuditLog` row (see ADR-011/AGENTS.md: "every staff action... no
 * exceptions").
 */
class ProductReviewController extends Controller
{
    /**
     * The queue of submissions waiting for review, oldest first (see
     * docs/01-client-brief.md "staff tools").
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('reviewAny', Product::class);

        $products = Product::query()
            ->where('status', 'pending_review')
            ->with(['founder', 'topics', 'screenshots'])
            ->withCount(['votes', 'comments'])
            ->orderBy('submitted_at')
            ->paginate();

        return ProductResource::collection($products);
    }

    public function approve(Request $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('review', $product);

        $this->decide($request, $product, 'approved', 'approve_product');

        return $this->respond(new ProductResource($product->loadCount(['votes', 'comments'])->load(['topics', 'screenshots'])), 'Product approved.');
    }

    public function reject(ReviewProductRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('review', $product);

        $this->decide($request, $product, 'rejected', 'reject_product');

        return $this->respond(new ProductResource($product->loadCount(['votes', 'comments'])->load(['topics', 'screenshots'])), 'Product rejected.');
    }

    public function requestChanges(ReviewProductRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('review', $product);

        $this->decide($request, $product, 'changes_requested', 'request_product_changes');

        return $this->respond(new ProductResource($product->loadCount(['votes', 'comments'])->load(['topics', 'screenshots'])), 'Changes requested.');
    }

    /**
     * Shared by approve/reject/requestChanges: writes the product_reviews
     * row, the audit log row, and the new product status in one transaction.
     */
    private function decide(Request $request, Product $product, string $status, string $auditAction): void
    {
        $notes = $request->input('notes');

        DB::transaction(function () use ($request, $product, $status, $auditAction, $notes) {
            ProductReview::create([
                'product_id' => $product->id,
                'reviewer_id' => $request->user()->id,
                'action' => $status,
                'notes' => $notes,
            ]);

            $product->update(['status' => $status]);

            AuditLog::record($request->user(), $auditAction, $product, $notes);
        });
    }
}
