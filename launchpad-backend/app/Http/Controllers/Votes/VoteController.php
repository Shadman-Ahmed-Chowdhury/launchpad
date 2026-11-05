<?php

namespace App\Http\Controllers\Votes;

use App\Http\Controllers\Controller;
use App\Http\Resources\Products\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    /**
     * A member casts a vote on a launched product they don't own, once per
     * product (see docs/01-client-brief.md "Voting and comments", ADR-029).
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('vote', $product);

        $product->votes()->create(['user_id' => $request->user()->id]);

        return $this->respond($this->withViewerVote($product, $request), 'Vote cast.', 201);
    }

    /**
     * A member takes back their own vote — soft-retracted, not deleted
     * (ADR-014), so a vote/retract/recast pattern stays visible for
     * anti-abuse review later.
     */
    public function destroy(Request $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('unvote', $product);

        $product->activeVotes()->where('user_id', $request->user()->id)->update(['retracted_at' => now()]);

        return $this->respond($this->withViewerVote($product, $request), 'Vote removed.');
    }

    /**
     * Reloads the product with a fresh `votes_count` and the viewer's own
     * active-vote state, so the response reflects the action that was just
     * taken (see `ProductResource::voted_by_viewer`).
     */
    private function withViewerVote(Product $product, Request $request): ProductResource
    {
        $product->loadCount(['activeVotes as votes_count'])
            ->load('topics')
            ->load(['activeVotes' => fn ($query) => $query->where('user_id', $request->user()->id)]);

        return new ProductResource($product);
    }
}
