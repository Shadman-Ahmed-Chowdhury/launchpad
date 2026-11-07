import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyProducts, STATUS_LABELS } from "@/lib/products";
import { SubmitForReviewButton } from "../submit-for-review-button";
import { ScheduleLaunchForm } from "./schedule-launch-form";

/**
 * Mirrors ProductPolicy::update()'s allow-list (see ADR-035) — a product
 * name here links straight to its real detail page (`/products/[slug]`,
 * not a second dashboard-only one — see ADR-034), which shows its own Edit
 * button to the owner for exactly these statuses.
 */
const EDITABLE_STATUSES = [
  "draft",
  "changes_requested",
  "pending_review",
  "approved",
  "scheduled",
  "launched",
];

export default async function MyProductsPage() {
  await requireUser("/dashboard/products");
  const products = await getMyProducts();

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">
          Your products
        </h1>
        <Link
          href="/dashboard/products/new"
          className="rounded-full bg-gold-fill px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
        >
          Submit a product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-muted">
          You haven&apos;t submitted a product yet.{" "}
          <Link
            href="/dashboard/products/new"
            className="text-foreground underline underline-offset-4"
          >
            Submit your first one.
          </Link>
        </p>
      ) : (
        <div className="mt-6 divide-y divide-hairline">
          {products.map((product) => {
            const canEdit = EDITABLE_STATUSES.includes(product.status);
            const canSubmit =
              product.status === "draft" || product.status === "changes_requested";
            const canSchedule =
              product.status === "approved" || product.status === "scheduled";
            const showReviewNote =
              (product.status === "rejected" || product.status === "changes_requested") &&
              product.latestReview?.notes;

            return (
              <div key={product.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground font-display text-lg text-background">
                    {product.name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-medium transition-colors hover:text-gold"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {product.tagline}
                    </p>
                    {showReviewNote && (
                      <p className="mt-1 text-sm text-danger">
                        {product.latestReview!.notes}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-muted">
                    {STATUS_LABELS[product.status] ?? product.status}
                  </span>

                  {canEdit && (
                    <Link
                      href={`/dashboard/products/${product.slug}/edit`}
                      className="shrink-0 text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Edit
                    </Link>
                  )}

                  {canSubmit && <SubmitForReviewButton slug={product.slug} />}

                  <div className="w-14 shrink-0 text-right">
                    <div className="font-display text-xl text-gold">
                      {product.votesCount}
                    </div>
                    <div className="text-xs text-muted">votes</div>
                  </div>
                </div>

                {canSchedule && (
                  <ScheduleLaunchForm slug={product.slug} launchDate={product.launchDate} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
