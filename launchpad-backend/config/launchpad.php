<?php

return [
    /*
     * How many products may share the same launch_date (see docs/02-features.md
     * "limited slots per day" and ADR-027).
     */
    'max_launches_per_day' => env('LAUNCH_SLOTS_PER_DAY', 2),
];
