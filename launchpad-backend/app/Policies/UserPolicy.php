<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * A member can only edit their own profile.
     */
    public function update(User $user, User $model): bool
    {
        return $user->is($model);
    }

    /**
     * Admin-only — creating and listing reviewer accounts isn't something a
     * reviewer can do for themselves (see docs/02-features.md "Admin").
     */
    public function manageReviewers(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Gates the admin members list (see docs/02-features.md "Admin").
     */
    public function manageMembers(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Admin-only, and only against a plain member — staff accounts are
     * suspended by removing their role (see ReviewerController::destroy()),
     * and an admin can't suspend themselves this way.
     */
    public function suspend(User $user, User $model): bool
    {
        return $user->isAdmin() && ! $model->isStaff() && ! $user->is($model);
    }
}
