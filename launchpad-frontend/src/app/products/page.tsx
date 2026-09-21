import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";

export default function ProductsPage() {
  const products = getProducts();

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

          <div className="mt-12 divide-y divide-hairline">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
