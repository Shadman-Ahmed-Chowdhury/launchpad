import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/auth";
import { getMyProducts } from "@/lib/products";
import { ResendVerificationButton } from "./resend-verification-button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  approved: "Approved",
  scheduled: "Scheduled",
  launched: "Launched",
  taken_down: "Taken down",
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const products = await getMyProducts();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              Welcome, {user.firstName}
            </h1>
            <p className="mt-2 text-muted">
              Views, votes over the day, traffic sources, and rank will show
              up here once that tracking exists — for now, here&apos;s what
              you&apos;ve submitted.
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 text-sm text-muted transition-colors hover:text-foreground"
          >
            Settings
          </Link>
        </div>

        {!user.emailVerified && (
          <div className="mt-6 rounded-lg border border-hairline px-4 py-3">
            <p className="text-sm">
              Confirm your email to vote and comment — check your inbox for
              the link we sent.
            </p>
            <ResendVerificationButton />
          </div>
        )}

        <div className="mt-10 flex items-center gap-4 rounded-lg border border-hairline p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold-fill font-display text-lg text-background">
            {user.firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="font-display text-xl">Your products</h2>
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
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-5 py-5 first:pt-0 last:pb-0"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground font-display text-lg text-background">
                  {product.name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  {product.status === "launched" ? (
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-medium transition-colors hover:text-gold"
                    >
                      {product.name}
                    </Link>
                  ) : (
                    <p className="font-medium">{product.name}</p>
                  )}
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {product.tagline}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-muted">
                  {STATUS_LABELS[product.status] ?? product.status}
                </span>

                {product.status === "draft" && (
                  <Link
                    href={`/dashboard/products/${product.slug}/edit`}
                    className="shrink-0 text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Edit
                  </Link>
                )}

                <div className="w-14 shrink-0 text-right">
                  <div className="font-display text-xl text-gold">
                    {product.votesCount}
                  </div>
                  <div className="text-xs text-muted">votes</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
