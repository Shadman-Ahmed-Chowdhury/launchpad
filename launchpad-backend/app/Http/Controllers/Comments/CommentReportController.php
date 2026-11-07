<?php

namespace App\Http\Controllers\Comments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comments\StoreCommentReportRequest;
use App\Http\Resources\Comments\CommentResource;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;

class CommentReportController extends Controller
{
    /**
     * A member flags a comment or reply for staff to review (see
     * `CommentPolicy::report()`). There's no reviewer-facing queue for
     * these yet — same deliberate scope cut ADR-025 made for the review
     * flow before a dashboard existed for it (see ADR-038).
     */
    public function store(StoreCommentReportRequest $request, Comment $comment): JsonResponse
    {
        $this->authorize('report', $comment);

        $comment->reports()->create([
            'reporter_id' => $request->user()->id,
            'reason' => $request->validated('reason'),
        ]);

        $comment->loadCount('likes')
            ->load('user')
            ->load(['reports' => fn ($query) => $query->where('reporter_id', $request->user()->id)]);

        return $this->respond(new CommentResource($comment), 'Comment reported.', 201);
    }
}
