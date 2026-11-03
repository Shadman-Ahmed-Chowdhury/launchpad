<?php

namespace App\Http\Controllers\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\CreateReviewerRequest;
use App\Http\Requests\Accounts\UpdateReviewerRequest;
use App\Http\Resources\Accounts\AuthUserResource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Admin-only staff account management (see ADR-026) — there's no public
 * signup path to the reviewer role; an admin provisions the login directly.
 */
class ReviewerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('manageReviewers', User::class);

        $reviewers = User::where('role', 'reviewer')->latest()->paginate();

        return AuthUserResource::collection($reviewers);
    }

    public function store(CreateReviewerRequest $request): JsonResponse
    {
        $this->authorize('manageReviewers', User::class);

        $data = $request->validated();

        $reviewer = DB::transaction(function () use ($request, $data) {
            $reviewer = new User;
            $reviewer->forceFill([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'handle' => User::generateUniqueHandle($data['first_name'], $data['last_name']),
                'auth_provider' => 'password',
                'password_hash' => Hash::make($data['password']),
                'role' => 'reviewer',
                // An admin is vouching for this account directly — it doesn't
                // go through the public email-verification flow (ADR-010).
                'email_verified_at' => now(),
            ])->save();

            AuditLog::record($request->user(), 'create_reviewer', $reviewer);

            return $reviewer;
        });

        return $this->respond(new AuthUserResource($reviewer), 'Reviewer created.', 201);
    }

    public function update(UpdateReviewerRequest $request, string $id): JsonResponse
    {
        $this->authorize('manageReviewers', User::class);

        $reviewer = User::where('role', 'reviewer')->where('id', $id)->firstOrFail();
        $reviewer->fill($request->validated())->save();

        AuditLog::record($request->user(), 'update_reviewer', $reviewer);

        return $this->respond(new AuthUserResource($reviewer), 'Reviewer updated.');
    }

    /**
     * Revokes the reviewer role rather than deleting the account — a
     * reviewer's past decisions (`product_reviews`) and audit log rows keep
     * their actor, exactly as the brief's "a record of every action our
     * staff took" requires (see ADR-028).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->authorize('manageReviewers', User::class);

        $reviewer = User::where('role', 'reviewer')->where('id', $id)->firstOrFail();
        $reviewer->forceFill(['role' => 'member'])->save();

        AuditLog::record($request->user(), 'revoke_reviewer', $reviewer);

        return $this->respond(null, 'Reviewer access revoked.');
    }
}
