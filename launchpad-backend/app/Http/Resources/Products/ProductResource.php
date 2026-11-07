<?php

namespace App\Http\Resources\Products;

use App\Models\ProductScreenshot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // 'sanctum' explicitly: `index`/`show` have no `auth:sanctum`
        // middleware (they're public), so the default guard never resolves
        // a Bearer-token viewer there — asking the sanctum guard directly
        // works whether or not that middleware ran (see ADR-029).
        $viewer = $request->user('sanctum');
        $isFounderOrStaff = $viewer && ($viewer->id === $this->founder_id || $viewer->isStaff());

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'logo' => $this->logoUrl(),
            'topics' => $this->whenLoaded('topics', fn () => $this->topics->pluck('name')->values()),
            'screenshots' => $this->whenLoaded('screenshots', fn () => $this->screenshots->map(fn (ProductScreenshot $screenshot) => [
                'id' => $screenshot->id,
                'url' => $screenshot->url(),
            ])->values()),
            'website_url' => $this->website_url,
            'status' => $this->status,
            'votes_count' => $this->votes_count,
            // Only accurate when the controller eager-loaded `activeVotes`
            // scoped to this viewer (see ProductController) — defaults to
            // false otherwise (e.g. the dashboard's `mine()` list, where a
            // founder can never have voted on their own product).
            'voted_by_viewer' => $this->relationLoaded('activeVotes') && $this->activeVotes->isNotEmpty(),
            'launch_date' => $this->launch_date,
            'submitted_at' => $this->submitted_at,
            'founder' => $this->whenLoaded('founder', fn () => [
                'id' => $this->founder->id,
                'name' => "{$this->founder->first_name} {$this->founder->last_name}",
                'handle' => $this->founder->handle,
            ]),
            // Only the founder or staff see why a submission was approved,
            // rejected, or sent back for changes (see ADR-025).
            'latest_review' => $this->when(
                $isFounderOrStaff && $this->relationLoaded('latestReview') && $this->latestReview,
                fn () => [
                    'action' => $this->latestReview->action,
                    'notes' => $this->latestReview->notes,
                    'created_at' => $this->latestReview->created_at,
                ],
            ),
        ];
    }
}
