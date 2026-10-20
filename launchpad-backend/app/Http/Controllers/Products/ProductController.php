<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\Products\ProductResource;
use App\Models\Product;
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
    public function index(): AnonymousResourceCollection
    {
        $products = Product::query()
            ->where('status', 'launched')
            ->withCount('votes')
            ->with('topics')
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
            ->withCount('votes')
            ->with('topics')
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
        $product = Product::where('slug', $slug)
            ->withCount('votes')
            ->with('topics')
            ->firstOrFail();

        $viewer = $request->user('sanctum');

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
            $data['logo'] = Storage::disk('s3')->putFile('product-logos', $request->file('logo'), 'public');
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

        return $this->respond(new ProductResource($product->loadCount('votes')->load('topics')), 'Product created.', 201);
    }

    /**
     * A founder edits their own product. Once launched, only `description`
     * and `website_url` may change (see docs/02-features.md).
     */
    public function update(UpdateProductRequest $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        $this->authorize('update', $product);

        $data = $request->validated();

        if ($product->status === 'launched') {
            $data = collect($data)->only(['description', 'website_url'])->all();
        }

        if ($request->hasFile('logo') && $product->status !== 'launched') {
            $data['logo'] = Storage::disk('s3')->putFile('product-logos', $request->file('logo'), 'public');
        }

        $product->fill(collect($data)->except('topic_ids')->all())->save();

        if (array_key_exists('topic_ids', $data)) {
            $product->topics()->sync($data['topic_ids']);
        }

        return $this->respond(new ProductResource($product->loadCount('votes')->load('topics')));
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
}
