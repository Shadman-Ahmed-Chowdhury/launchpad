import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/auth";
import { getProductForEdit, getTopics } from "@/lib/products";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser(`/dashboard/products/${slug}/edit`);

  const [product, topics] = await Promise.all([
    getProductForEdit(slug),
    getTopics(),
  ]);

  // Editing is draft-only for now — launched products have their own,
  // more restricted edit rules (see docs/02-features.md) not built here yet.
  if (!product || product.status !== "draft") {
    notFound();
  }

  const topicIds = topics
    .filter((topic) => product.topics.includes(topic.name))
    .map((topic) => topic.id);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">
          Edit product
        </h1>
        <p className="mt-2 text-muted">
          Still a draft — nothing is public yet.
        </p>

        <ProductForm
          topics={topics}
          slug={slug}
          defaultValues={{
            name: product.name,
            tagline: product.tagline,
            description: product.description,
            websiteUrl: product.websiteUrl,
            topicIds,
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
