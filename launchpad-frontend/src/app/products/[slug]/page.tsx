import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VoteButton } from "@/components/vote-button";
import { ShareButton } from "@/components/share-button";
import { ImageIcon, PencilIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";

/**
 * Comments aren't a built feature yet (see docs/02-features.md) — these are
 * static placeholders so the page reads the way a launched product's page
 * will once commenting exists, not data from the API.
 */
const DUMMY_COMMENTS = [
  {
    name: "Priya Shah",
    initial: "P",
    timeAgo: "2h ago",
    body: "Really clean execution — the onboarding took me under a minute. How does this handle larger teams?",
  },
  {
    name: "Marcus Webb",
    initial: "M",
    timeAgo: "5h ago",
    body: "Congrats on the launch! Curious whether there's a public roadmap anywhere.",
  },
];

/**
 * Editing is only possible while a product is still a draft, sent back for
 * changes, or already launched (description/website only once launched —
 * see docs/02-features.md); every other status (pending review, approved,
 * scheduled) has no edit flow at all, so the button shouldn't be offered.
 */
const EDITABLE_STATUSES = ["draft", "changes_requested", "launched"];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, currentUser] = await Promise.all([
    getProductBySlug(slug),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  const isOwnProduct = Boolean(
    currentUser && product.founder && product.founder.id === currentUser.id,
  );
  const canEdit = isOwnProduct && EDITABLE_STATUSES.includes(product.status);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
            {/* Left pane: product details */}
            <div className="min-w-0">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-foreground font-display text-2xl text-background">
                  {product.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="font-display text-3xl tracking-tight">
                      {product.name}
                    </h1>
                    {canEdit && (
                      <Link
                        href={`/dashboard/products/${product.slug}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-lg text-muted">{product.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-sm text-muted">
                    {product.topics.map((topic) => (
                      <span key={topic}>{topic}</span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-10 max-w-xl text-base leading-relaxed text-muted">
                {product.description}
              </p>

              <div className="mt-8 flex aspect-video w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-gradient-to-br from-gold-fill/10 to-foreground/5 text-muted">
                <ImageIcon className="h-6 w-6" />
                <span className="text-sm">Product screenshot</span>
              </div>

              <div id="comments" className="mt-16 scroll-mt-16 border-t border-hairline pt-10">
                <h2 className="font-display text-xl">
                  Comments <span className="text-muted">({DUMMY_COMMENTS.length})</span>
                </h2>

                <div className="mt-6 space-y-6">
                  {DUMMY_COMMENTS.map((comment) => (
                    <div key={comment.name} className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-sm text-background">
                        {comment.initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium">{comment.name}</span>
                          <span className="text-xs text-muted">{comment.timeAgo}</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right pane: actions */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="space-y-3 rounded-xl border border-hairline p-5">
                <VoteButton
                  slug={product.slug}
                  votesCount={product.votesCount}
                  votedByViewer={product.votedByViewer}
                  disabled={isOwnProduct}
                  variant="block"
                />
                <a
                  href={product.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-lg bg-gold-fill px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
                >
                  Visit website
                </a>
                <ShareButton title={product.name} />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
