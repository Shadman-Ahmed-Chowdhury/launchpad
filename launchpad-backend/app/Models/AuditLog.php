<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per staff action (approve, reject, suspend, feature, take down,
 * resolve report) — see ADR-011 and AGENTS.md "every staff action... no
 * exceptions". `target_type`/`target_id` is a loose polymorphic pair rather
 * than a real FK since the target can be a product, user, or comment.
 */
#[Fillable(['actor_id', 'action', 'target_type', 'target_id', 'notes'])]
class AuditLog extends Model
{
    const UPDATED_AT = null;

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Record a staff action. `$target` is the model acted on (its class
     * basename lowercased becomes `target_type`, e.g. Product -> "product").
     */
    public static function record(User $actor, string $action, Model $target, ?string $notes = null): self
    {
        return static::create([
            'actor_id' => $actor->id,
            'action' => $action,
            'target_type' => strtolower(class_basename($target)),
            'target_id' => $target->getKey(),
            'notes' => $notes,
        ]);
    }
}
