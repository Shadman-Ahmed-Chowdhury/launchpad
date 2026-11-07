<?php

namespace App\Http\Controllers\Comments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comments\StoreCommentRequest;
use App\Http\Resources\Comments\CommentResource;
use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use App\Notifications\Comments\NewCommentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentController extends Controller
{
    /**
     * Top-level comments on a product, newest first, each with its replies
     * eager-loaded oldest-first (see `Comment::replies()`) — one level of
     * reply only, so a reply never has further nested replies to load.
     * Public route (no `auth:sanctum` middleware) — `$viewer` is optional,
     * same `sanctum` guard pattern `ProductController::index()` uses, so
     * `liked_by_viewer`/`reported_by_viewer` only populate for a signed-in
     * visitor.
     */
    public function index(Request $request, string $slug): AnonymousResourceCollection
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $viewer = $request->user('sanctum');

        $comments = $product->comments()
            ->whereNull('parent_comment_id')
            ->withCount('likes')
            ->with($this->viewerScopedRelations($viewer))
            ->with(['replies' => fn ($query) => $query
                ->withCount('likes')
                ->with($this->viewerScopedRelations($viewer))])
            ->latest()
            ->paginate();

        return CommentResource::collection($comments);
    }

    /**
     * `user`, plus — only when there's a signed-in viewer — their own
     * `likes`/`reports` rows on each comment, so `CommentResource` can flag
     * `liked_by_viewer`/`reported_by_viewer` without an N+1 query. Shared
     * between the top-level query and the nested `replies` eager load so
     * both get the same viewer-scoped state.
     *
     * @return array<string, \Closure|string>
     */
    private function viewerScopedRelations(?User $viewer): array
    {
        $relations = ['user'];

        if ($viewer) {
            $relations['likes'] = fn ($query) => $query->where('user_id', $viewer->id);
            $relations['reports'] = fn ($query) => $query->where('reporter_id', $viewer->id);
        }

        return $relations;
    }

    /**
     * A member comments on a product, or replies to one of its top-level
     * comments (`parent_comment_id` set) — see `CommentPolicy`. The product's
     * founder is told by email unless they're the one commenting (see
     * docs/01-client-brief.md "Voting and comments").
     */
    public function store(StoreCommentRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $parentId = $request->validated('parent_comment_id');

        if ($parentId) {
            $parent = Comment::where('product_id', $product->id)->findOrFail($parentId);
            $this->authorize('reply', $parent);
        } else {
            $this->authorize('create', [Comment::class, $product]);
        }

        $comment = $product->comments()->create([
            'user_id' => $request->user()->id,
            'parent_comment_id' => $parentId,
            'body' => $request->validated('body'),
        ]);

        if (! $request->user()->is($product->founder)) {
            $product->founder->notify(new NewCommentNotification($comment));
        }

        $comment->loadCount('likes')->load($this->viewerScopedRelations($request->user()));

        return $this->respond(new CommentResource($comment), 'Comment posted.', 201);
    }
}
