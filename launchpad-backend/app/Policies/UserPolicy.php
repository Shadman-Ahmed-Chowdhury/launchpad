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
}
