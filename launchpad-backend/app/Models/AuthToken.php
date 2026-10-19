<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AuthToken extends Model
{
    const UPDATED_AT = null;

    const KIND_VERIFY_EMAIL = 'verify_email';

    const KIND_RESET_PASSWORD = 'reset_password';

    protected $fillable = ['user_id', 'kind', 'token_hash', 'expires_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Issue a new token for the given user/kind and return the raw (unhashed)
     * token to send by email. Only the hash is ever persisted.
     */
    public static function issue(User $user, string $kind, int $ttlMinutes): string
    {
        $raw = Str::random(64);

        $user->authTokens()->create([
            'kind' => $kind,
            'token_hash' => hash('sha256', $raw),
            'expires_at' => Carbon::now()->addMinutes($ttlMinutes),
        ]);

        return $raw;
    }

    /**
     * Find the unused, unexpired token matching the raw value and kind, and
     * mark it used so it can't be replayed. Returns null if no valid match.
     */
    public static function consume(string $raw, string $kind): ?self
    {
        $token = static::query()
            ->where('kind', $kind)
            ->where('token_hash', hash('sha256', $raw))
            ->whereNull('used_at')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        $token?->forceFill(['used_at' => Carbon::now()])->save();

        return $token;
    }
}
