import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyProductBySlug, STATUS_LABELS } from "@/lib/products";
import { SubmitForReviewButton } from "../../submit-for-review-button";
import { ScheduleLaunchForm } from "../schedule-launch-form";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser(`/dashboard/products/${slug}`);

  const product = await getMyProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const canEdit = product.status === "draft" || product.status === "changes_requested";
  const canSchedule = product.status === "approved" || product.status === "scheduled";
  const showReviewNote =
    (product.status === "rejected" || product.status === "changes_requested") &&
    product.latestReview?.notes;

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <Link
        href="/dashboard/products"
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        Back to your products
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{product.name}</h1>
          <p className="mt-2 text-muted">{product.tagline}</p>
        </div>
        <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-muted">
          {STATUS_LABELS[product.status] ?? product.status}
        </span>
      </div>

      {showReviewNote && (
        <p className="mt-6 rounded-lg border border-hairline px-4 py-3 text-sm text-danger">
          {product.latestReview!.notes}
        </p>
      )}

      <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">
        {product.description}
      </p>

      {product.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-3 text-sm text-muted">
          {product.topics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
      )}

      <a
        href={product.websiteUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm text-foreground underline underline-offset-4 hover:text-gold"
      >
        Visit website
      </a>

      <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-hairline pt-6">
        <div>
          <div className="font-display text-xl text-gold">{product.votesCount}</div>
          <div className="text-xs text-muted">votes</div>
        </div>

        {canEdit && (
          <Link
            href={`/dashboard/products/${product.slug}/edit`}
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Edit
          </Link>
        )}

        {canEdit && <SubmitForReviewButton slug={product.slug} />}

        {product.status === "launched" && (
          <Link
            href={`/products/${product.slug}`}
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            View public page
          </Link>
        )}
      </div>

      {canSchedule && (
        <div className="mt-6">
          <p className="text-sm font-medium">
            {product.launchDate ? "Launch day" : "Pick a launch day"}
          </p>
          <ScheduleLaunchForm slug={product.slug} launchDate={product.launchDate} />
        </div>
      )}
    </div>
  );
}
