<?php

namespace App\Http\Resources\Comments;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'parent_comment_id' => $this->parent_comment_id,
            'created_at' => $this->created_at,
            'author' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => "{$this->user->first_name} {$this->user->last_name}",
                'handle' => $this->user->handle,
                'avatar_url' => $this->user->avatarUrl(),
            ]),
            'likes_count' => $this->likes_count,
            // Only accurate when the controller eager-loaded `likes`/
            // `reports` scoped to the viewer (see CommentController,
            // CommentLikeController, CommentReportController) — defaults to
            // false otherwise, same convention as ProductResource's
            // `voted_by_viewer` (see ADR-029).
            'liked_by_viewer' => $this->relationLoaded('likes') && $this->likes->isNotEmpty(),
            'reported_by_viewer' => $this->relationLoaded('reports') && $this->reports->isNotEmpty(),
            // Only ever populated on a top-level comment — a reply has no
            // `replies` relation loaded (one level of reply only, see
            // CommentPolicy::reply()).
            'replies' => $this->whenLoaded('replies', fn () => CommentResource::collection($this->replies)),
        ];
    }
}
