import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireStaff } from "@/lib/auth";
import { getReviewQueue } from "@/lib/products";
import { ReviewActions } from "./review-actions";

export default async function StaffPage() {
  const user = await requireStaff("/staff");
  const queue = await getReviewQueue();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Review queue</h1>
            <p className="mt-2 text-muted">
              Submissions waiting for a decision, oldest first.
            </p>
          </div>
          {user.role === "admin" && (
            <Link
              href="/staff/reviewers"
              className="shrink-0 text-sm text-muted underline underline-offset-4 hover:text-foreground"
            >
              Manage reviewers
            </Link>
          )}
        </div>

        {queue.length === 0 ? (
          <p className="mt-10 text-muted">Nothing waiting for review.</p>
        ) : (
          <div className="mt-10 divide-y divide-hairline">
            {queue.map((product) => (
              <div key={product.id} className="py-6 first:pt-0 last:pb-0">
                <div className="flex items-start gap-5">
                  {product.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.logo}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground font-display text-lg text-background">
                      {product.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-0.5 text-sm text-muted">{product.tagline}</p>
                    {product.founder && (
                      <p className="mt-1 text-xs text-muted">
                        by {product.founder.name} ({product.founder.handle})
                      </p>
                    )}
                    {product.submittedAt && (
                      <p className="mt-1 text-xs text-muted">
                        Submitted{" "}
                        {new Date(product.submittedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {product.description}
                </p>

                {product.topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted">
                    {product.topics.map((topic) => (
                      <span key={topic}>{topic}</span>
                    ))}
                  </div>
                )}

                <a
                  href={product.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-foreground underline underline-offset-4 hover:text-gold"
                >
                  Visit website
                </a>

                <ReviewActions slug={product.slug} />
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
