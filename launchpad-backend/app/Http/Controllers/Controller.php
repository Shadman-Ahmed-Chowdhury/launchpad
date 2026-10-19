<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

abstract class Controller
{
    use AuthorizesRequests;

    /**
     * Standard success envelope for the whole API (see ADR-022) — every
     * controller returns `{"data": ..., "message": ...}` instead of ad hoc
     * top-level keys. `$data` may itself contain Resources/arrays.
     */
    protected function respond(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return response()->json(['data' => $data, 'message' => $message], $status);
    }
}
