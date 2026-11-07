<?php

namespace App\Http\Controllers\Comments;

use App\Http\Controllers\Controller;
use App\Http\Resources\Comments\CommentResource;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentLikeController extends Controller
{
    /**
     * A member likes a comment or reply, once per member (see
     * `CommentPolicy::like()`).
     */
    public function store(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('like', $comment);

        $comment->likes()->create(['user_id' => $request->user()->id]);

        return $this->respond($this->withViewerState($comment, $request), 'Comment liked.', 201);
    }

    /**
     * A member takes back their own like — hard-deleted, unlike a vote
     * retraction (see `CommentLike`, ADR-038).
     */
    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('unlike', $comment);

        $comment->likes()->where('user_id', $request->user()->id)->delete();

        return $this->respond($this->withViewerState($comment, $request), 'Comment unliked.');
    }

    /**
     * Reloads the comment with a fresh `likes_count` and the viewer's own
     * like state, so the response reflects the action that was just taken
     * (see `VoteController::withViewerVote()` for the equivalent on votes).
     */
    private function withViewerState(Comment $comment, Request $request): CommentResource
    {
        $comment->loadCount('likes')
            ->load('user')
            ->load(['likes' => fn ($query) => $query->where('user_id', $request->user()->id)])
            ->load(['reports' => fn ($query) => $query->where('reporter_id', $request->user()->id)]);

        return new CommentResource($comment);
    }
}
