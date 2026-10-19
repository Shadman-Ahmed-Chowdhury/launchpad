<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\UpdateProfileRequest;
use App\Http\Resources\Accounts\AuthUserResource;
use App\Http\Resources\Accounts\PublicProfileResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $user = User::where('handle', $handle)->with('links')->firstOrFail();

        return $this->respond(new PublicProfileResource($user));
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
            $data['avatar'] = Storage::disk('s3')->putFile('avatars', $request->file('avatar'), 'public');
        }

        $user->fill(collect($data)->except('links')->all())->save();

        if (array_key_exists('links', $data)) {
            $user->links()->delete();
            $user->links()->createMany($data['links']);
        }

        return $this->respond(new AuthUserResource($user->load('links')));
    }
}
