<?php

namespace App\Http\Resources\Accounts;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'handle' => $this->handle,
            'auth_provider' => $this->auth_provider,
            'role' => $this->role,
            'bio' => $this->bio,
            'avatar_url' => $this->avatarUrl(),
            'email_verified' => $this->hasVerifiedEmail(),
            'links' => UserLinkResource::collection($this->whenLoaded('links')),
            'created_at' => $this->created_at,
        ];
    }
}
