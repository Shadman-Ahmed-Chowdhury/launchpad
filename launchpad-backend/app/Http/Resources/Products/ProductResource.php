<?php

namespace App\Http\Resources\Products;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $isFounderOrStaff = $viewer && ($viewer->id === $this->founder_id || $viewer->isStaff());

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'logo' => $this->logoUrl(),
            'topics' => $this->whenLoaded('topics', fn () => $this->topics->pluck('name')->values()),
            'website_url' => $this->website_url,
            'status' => $this->status,
            'votes_count' => $this->votes_count,
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
