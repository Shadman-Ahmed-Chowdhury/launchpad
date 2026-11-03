<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Resources\Accounts\AuthUserResource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Admin-only member management (see docs/02-features.md "Admin: can suspend
 * a member", ADR-028). Staff accounts don't appear here — they're managed
 * through ReviewerController.
 */
class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('manageMembers', User::class);

        $members = User::where('role', 'member')->latest()->paginate();

        return AuthUserResource::collection($members);
    }

    public function suspend(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->authorize('suspend', $user);

        $user->forceFill(['is_suspended' => true])->save();
        AuditLog::record($request->user(), 'suspend_user', $user);

        return $this->respond(new AuthUserResource($user), 'Member suspended.');
    }

    public function unsuspend(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->authorize('suspend', $user);

        $user->forceFill(['is_suspended' => false])->save();
        AuditLog::record($request->user(), 'unsuspend_user', $user);

        return $this->respond(new AuthUserResource($user), 'Member unsuspended.');
    }
}
