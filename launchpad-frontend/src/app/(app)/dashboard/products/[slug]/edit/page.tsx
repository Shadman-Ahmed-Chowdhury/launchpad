import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyProductBySlug, getTopics } from "@/lib/products";
import { ProductForm } from "../../product-form";
import { LaunchedProductForm } from "../../../launched-product-form";

const EDITABLE_STATUSES = ["draft", "changes_requested", "launched"];

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

  if (!product || !EDITABLE_STATUSES.includes(product.status)) {
    notFound();
  }

  if (product.status === "launched") {
    return (
      <div className="mx-auto w-full max-w-[80%] px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">Edit product</h1>
        <p className="mt-2 text-muted">
          It&apos;s live — only the description and website link can change
          now (see docs/02-features.md).
        </p>

        <LaunchedProductForm
          slug={slug}
          defaultValues={{
            description: product.description,
            websiteUrl: product.websiteUrl,
          }}
        />
      </div>
    );
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
