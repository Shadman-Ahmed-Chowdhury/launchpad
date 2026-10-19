<?php

namespace App\Http\Controllers;

use App\Http\Resources\TopicResource;
use App\Models\Topic;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TopicController extends Controller
{
    /**
     * The fixed topic taxonomy — lets the add-product form render topic
     * choices without hardcoding them on the frontend. Paginated per
     * ADR-022/AGENTS.md convention, but with a page size generous enough
     * that this small, curated taxonomy always fits on page one — the
     * add/edit product form only ever requests page one.
     */
    public function index(): AnonymousResourceCollection
    {
        return TopicResource::collection(Topic::orderBy('name')->paginate(100));
    }
}
