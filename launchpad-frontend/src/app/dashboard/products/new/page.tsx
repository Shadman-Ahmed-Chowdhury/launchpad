import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/auth";
import { getTopics } from "@/lib/products";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireUser("/dashboard/products/new");
  const topics = await getTopics();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">
          Submit a product
        </h1>
        <p className="mt-2 text-muted">
          This saves as a draft. There&apos;s no reviewer yet, so it won&apos;t
          go live on its own — picking a launch day comes later.
        </p>

        <ProductForm topics={topics} />
      </main>

      <SiteFooter />
    </div>
  );
}
