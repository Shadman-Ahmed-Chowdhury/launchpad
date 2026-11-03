import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyProductBySlug, getTopics } from "@/lib/products";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser(`/dashboard/products/${slug}/edit`);

  const [product, topics] = await Promise.all([
    getMyProductBySlug(slug),
    getTopics(),
  ]);

  // Editable while it's a draft, or while a reviewer has sent it back for
  // changes — launched products have their own, more restricted edit rules
  // (see docs/02-features.md) not built here yet.
  if (
    !product ||
    (product.status !== "draft" && product.status !== "changes_requested")
  ) {
    notFound();
  }

  const topicIds = topics
    .filter((topic) => product.topics.includes(topic.name))
    .map((topic) => topic.id);

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">Edit product</h1>
      <p className="mt-2 text-muted">
        {product.status === "changes_requested"
          ? "A reviewer sent this back for changes — update it and resubmit."
          : "Still a draft — nothing is public yet."}
      </p>

      {product.status === "changes_requested" && product.latestReview?.notes && (
        <p className="mt-4 rounded-lg border border-hairline px-4 py-3 text-sm text-danger">
          {product.latestReview.notes}
        </p>
      )}

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
    </div>
  );
}
