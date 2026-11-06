<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\UpdateProfileRequest;
use App\Http\Resources\Accounts\AuthUserResource;
use App\Http\Resources\Accounts\PublicProfileResource;
use App\Http\Resources\Products\ProductResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * The authenticated member's own account (private fields included).
     */
    public function me(Request $request): JsonResponse
    {
        return $this->respond(new AuthUserResource($request->user()->load('links')));
    }

    /**
     * Any member's public profile page.
     */
    public function show(string $handle): JsonResponse
    {
        $user = User::where('handle', $handle)
            ->with('links')
            ->withCount('launchedProducts')
            ->firstOrFail();

        return $this->respond(new PublicProfileResource($user));
    }

    /**
     * The member's launched products — paginated, same shape as the public
     * products index (see ADR-031). Kept as its own endpoint rather than
     * nested in `show()`'s payload so it still gets pagination `meta`/`links`
     * for free from `ProductResource::collection()`, same reasoning as
     * `/me` vs `/me/products`.
     */
    public function products(Request $request, string $handle): AnonymousResourceCollection
    {
        $user = User::where('handle', $handle)->firstOrFail();
        $viewer = $request->user('sanctum');

        $products = $user->launchedProducts()
            ->withCount(['activeVotes as votes_count'])
            ->with(['topics', 'founder'])
            ->when($viewer, fn ($query) => $query->with([
                'activeVotes' => fn ($q) => $q->where('user_id', $viewer->id),
            ]))
            ->latest('launched_at')
            ->paginate();

        return ProductResource::collection($products);
    }

    /**
     * Edit the authenticated member's own profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->authorize('update', $user);

        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $data['avatar'] = Storage::disk(config('filesystems.uploads'))->putFile('avatars', $request->file('avatar'), 'public');
        }

        $user->fill(collect($data)->except('links')->all())->save();

        if (array_key_exists('links', $data)) {
            $user->links()->delete();
            $user->links()->createMany($data['links']);
        }

        return $this->respond(new AuthUserResource($user->load('links')));
    }
}
