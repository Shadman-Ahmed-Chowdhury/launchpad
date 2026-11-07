import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { ProductSearchBar } from "@/components/product-search-bar";
import { PaginationControls } from "@/components/pagination-controls";
import { getCurrentUser } from "@/lib/auth";
import { getProducts, getTopics } from "@/lib/products";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    topics?: string;
    sort?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort = sp.sort === "newest" ? "newest" : "votes";
  const topics = sp.topics ? sp.topics.split(",").filter(Boolean) : undefined;

  const [{ products, pagination }, currentUser, allTopics] = await Promise.all([
    getProducts({ q: sp.q, topics, sort, from: sp.from, to: sp.to, page }),
    getCurrentUser(),
    getTopics(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="font-display text-4xl tracking-tight">
            Today&apos;s launches
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted">
            Best first. This list is frozen at the end of the day and never
            changes again.
          </p>

          <ProductSearchBar topics={allTopics} />

          {products.length === 0 ? (
            <p className="mt-12 text-muted">No products match your search.</p>
          ) : (
            <div className="mt-8 divide-y divide-hairline">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  rank={(pagination.currentPage - 1) * pagination.perPage + index + 1}
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}

          <PaginationControls
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            searchParams={sp}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
