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
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'logo' => $this->logoUrl(),
            'topics' => $this->whenLoaded('topics', fn () => $this->topics->pluck('name')->values()),
            'website_url' => $this->website_url,
            'votes_count' => $this->votes_count,
            'launch_date' => $this->launch_date,
        ];
    }
}
