<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\AddScreenshotsRequest;
use App\Http\Requests\Products\ScheduleProductRequest;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\Products\ProductResource;
use App\Models\Product;
use App\Models\ProductScreenshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Today's launched products, most-voted first (see ADR-024 — this is a
     * placeholder ordering until the ADR-009/013 decay-score ranking exists).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $viewer = $request->user('sanctum');

        $products = Product::query()
            ->where('status', 'launched')
            ->withCount(['activeVotes as votes_count'])
            ->with(['topics', 'screenshots', 'founder'])
            ->when($viewer, fn ($query) => $query->with([
                'activeVotes' => fn ($q) => $q->where('user_id', $viewer->id),
            ]))
            ->orderByDesc('votes_count')
            ->paginate();

        return ProductResource::collection($products);
    }

    /**
     * The authenticated founder's own products, any status, newest first —
     * powers the dashboard (the public `index()` above only shows `launched`
     * products, so a founder can't see their own drafts through it).
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        $products = $request->user()->products()
            ->withCount(['activeVotes as votes_count'])
            ->with(['topics', 'latestReview', 'screenshots'])
            ->latest()
            ->paginate();

        return ProductResource::collection($products);
    }

    /**
     * A single product's page. Public once `launched`; before that, only the
     * owning founder can preview it (e.g. to prefill the edit form) — optional
     * auth via the `sanctum` guard directly, since this route has no
     * `auth:sanctum` middleware and must still work for anonymous visitors.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $viewer = $request->user('sanctum');

        $product = Product::where('slug', $slug)
            ->withCount(['activeVotes as votes_count'])
            ->with(['topics', 'latestReview', 'screenshots', 'founder'])
            ->when($viewer, fn ($query) => $query->with([
                'activeVotes' => fn ($q) => $q->where('user_id', $viewer->id),
            ]))
            ->firstOrFail();

        if ($product->status !== 'launched' && (! $viewer || ! $viewer->is($product->founder))) {
            abort(404);
        }

        return $this->respond(new ProductResource($product));
    }

    /**
     * A member submits a new product as a draft (see docs/02-features.md —
     * picking a launch day is a separate, not-yet-built flow).
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $data['logo'] = Storage::disk(config('filesystems.uploads'))->putFile('product-logos', $request->file('logo'), 'public');
        }

        $product = Product::create([
            ...collect($data)->except('topic_ids')->all(),
            'founder_id' => $request->user()->id,
            'slug' => Product::generateUniqueSlug($data['name']),
            'status' => 'draft',
        ]);

        if (! empty($data['topic_ids'])) {
            $product->topics()->sync($data['topic_ids']);
        }

        foreach ($request->file('screenshots', []) as $position => $file) {
            $product->screenshots()->create([
                'image' => Storage::disk(config('filesystems.uploads'))->putFile('product-screenshots', $file, 'public'),
                'position' => $position,
            ]);
        }

        return $this->respond(new ProductResource($product->loadCount(['activeVotes as votes_count'])->load(['topics', 'screenshots'])), 'Product created.', 201);
    }

    /**
     * A founder edits their own product. Screenshots aren't part of this
     * endpoint — they're managed live via `addScreenshots()`/
     * `destroyScreenshot()` instead (see ADR-036).
     *
     * - `launched`: only `description`/`website_url` may change — everything
     *   else stays locked (see docs/02-features.md).
     * - `approved`/`scheduled`: anything may change, but it sends the
     *   product back to the reviewer queue — the content a reviewer already
     *   signed off on just moved (see ADR-033).
     * - `draft`/`changes_requested`/`pending_review`: anything may change,
     *   no status effect — a founder can fix a submission while a reviewer
     *   is still looking at it (see ADR-035).
     */
    public function update(UpdateProductRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('update', $product);

        $data = $request->validated();
        $isLaunched = $product->status === 'launched';

        if ($isLaunched) {
            $data = collect($data)->only(['description', 'website_url'])->all();
        }

        if ($request->hasFile('logo') && ! $isLaunched) {
            $data['logo'] = Storage::disk(config('filesystems.uploads'))->putFile('product-logos', $request->file('logo'), 'public');
        }

        $product->fill(collect($data)->except('topic_ids')->all());
        $this->resubmitIfReviewed($product);
        $product->save();

        if (array_key_exists('topic_ids', $data) && ! $isLaunched) {
            $product->topics()->sync($data['topic_ids']);
        }

        return $this->respond(new ProductResource($product->loadCount(['activeVotes as votes_count'])->load(['topics', 'screenshots'])));
    }

    /**
     * Appends up to three screenshots total — the `AddScreenshotsRequest`
     * rejects anything that would push the count past that. New screenshots
     * are positioned after whatever already exists, in upload order (see
     * ADR-036).
     */
    public function addScreenshots(AddScreenshotsRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('manageScreenshots', $product);

        $position = $product->screenshots()->count();

        foreach ($request->file('screenshots') as $file) {
            $product->screenshots()->create([
                'image' => Storage::disk(config('filesystems.uploads'))->putFile('product-screenshots', $file, 'public'),
                'position' => $position++,
            ]);
        }

        $this->resubmitIfReviewed($product);
        $product->save();

        return $this->respond(new ProductResource($product->loadCount(['activeVotes as votes_count'])->load(['topics', 'screenshots'])), 'Screenshot added.');
    }

    /**
     * Removes one screenshot and closes the gap it leaves behind, so
     * `position` stays contiguous (0..n-1) for the carousel (see ADR-036).
     */
    public function destroyScreenshot(string $slug, int $screenshot): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('manageScreenshots', $product);

        $product->screenshots()->where('id', $screenshot)->firstOrFail()->delete();

        $product->screenshots()->orderBy('position')->get()
            ->each(fn (ProductScreenshot $shot, int $index) => $shot->update(['position' => $index]));

        $this->resubmitIfReviewed($product);
        $product->save();

        return $this->respond(new ProductResource($product->loadCount(['activeVotes as votes_count'])->load(['topics', 'screenshots'])), 'Screenshot removed.');
    }

    /**
     * Shared by `update()` and the screenshot endpoints: changing a product
     * that's already been reviewed (`approved`/`scheduled`) sends it back
     * to the queue instead of silently changing live-reviewed content (see
     * ADR-033/ADR-036). A no-op for every other status.
     */
    private function resubmitIfReviewed(Product $product): void
    {
        if (in_array($product->status, ['approved', 'scheduled'], true)) {
            $product->status = 'pending_review';
            $product->submitted_at = now();
            $product->launch_date = null;
        }
    }

    /**
     * A founder can only remove their own product while it's still a draft
     * (see ProductPolicy).
     */
    public function destroy(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('delete', $product);

        $product->delete();

        return $this->respond(null, 'Product deleted.');
    }

    /**
     * A founder picks (or changes) their approved product's launch day,
     * limited to a set number of launches per day (see docs/02-features.md,
     * ADR-027).
     */
    public function scheduleLaunch(ScheduleProductRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('schedule', $product);

        $product->update([
            'status' => 'scheduled',
            'launch_date' => $request->validated('launch_date'),
        ]);

        return $this->respond(new ProductResource($product->loadCount(['activeVotes as votes_count'])->load(['topics', 'screenshots'])), 'Launch day set.');
    }

    /**
     * A founder submits their draft (or resubmits after changes were
     * requested) into the reviewer queue (see ADR-025).
     */
    public function submit(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('submit', $product);

        $product->update([
            'status' => 'pending_review',
            'submitted_at' => now(),
        ]);

        return $this->respond(new ProductResource($product->loadCount(['activeVotes as votes_count'])->load(['topics', 'screenshots'])), 'Product submitted for review.');
    }
}
