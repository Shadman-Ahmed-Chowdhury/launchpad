import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VoteButton } from "@/components/vote-button";
import { ShareButton } from "@/components/share-button";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";
import { TopicTag } from "@/components/topic-tag";
import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";
import { PencilIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { getComments } from "@/lib/comments";
import { getProductBySlug, STATUS_LABELS } from "@/lib/products";

/**
 * Editing is possible from draft, changes-requested, pending review,
 * approved, scheduled, or launched (see docs/02-features.md, ADR-035) —
 * approved/scheduled and launched each have their own restrictions
 * enforced server-side (ProductPolicy::update()); rejected/taken-down have
 * no edit flow at all, so the button shouldn't be offered for those.
 */
const EDITABLE_STATUSES = [
  "draft",
  "changes_requested",
  "pending_review",
  "approved",
  "scheduled",
  "launched",
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, currentUser, comments] = await Promise.all([
    getProductBySlug(slug),
    getCurrentUser(),
    getComments(slug),
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
                  <h1 className="font-display text-3xl tracking-tight">
                    {product.name}
                  </h1>
                  {product.founder && (
                    <Link
                      href={`/profile/${product.founder.handle}`}
                      className="mt-1 inline-block text-sm text-muted transition-colors hover:text-gold hover:underline"
                    >
                      by {product.founder.name}
                    </Link>
                  )}
                  <p className="mt-1 text-lg text-muted">{product.tagline}</p>
                  {product.topics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.topics.map((topic) => (
                        <TopicTag key={topic}>{topic}</TopicTag>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-10 max-w-xl text-base leading-relaxed text-muted">
                {product.description}
              </p>

              <ScreenshotCarousel screenshots={product.screenshots} />

              <div id="comments" className="mt-16 scroll-mt-16 border-t border-hairline pt-10">
                <h2 className="font-display text-xl">
                  Comments <span className="text-muted">({product.commentsCount})</span>
                </h2>

                <div className="mt-6">
                  {product.status === "launched" ? (
                    currentUser ? (
                      <CommentForm slug={product.slug} />
                    ) : (
                      <Link
                        href={`/login?next=${encodeURIComponent(`/products/${product.slug}#comments`)}`}
                        className="text-sm font-medium text-gold hover:underline"
                      >
                        Log in to comment
                      </Link>
                    )
                  ) : (
                    <p className="text-sm text-muted">Comments open once this product launches.</p>
                  )}
                </div>

                <div className="mt-8 space-y-6">
                  {comments.map((comment) => (
                    <CommentThread key={comment.id} slug={product.slug} comment={comment} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right pane: actions */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="space-y-3 rounded-xl border border-hairline p-5">
                {product.status === "launched" ? (
                  <VoteButton
                    slug={product.slug}
                    votesCount={product.votesCount}
                    votedByViewer={product.votedByViewer}
                    disabled={isOwnProduct}
                    variant="block"
                  />
                ) : (
                  isOwnProduct && (
                    <p className="rounded-lg border border-hairline px-4 py-3 text-center text-sm text-muted">
                      {STATUS_LABELS[product.status] ?? product.status}
                      <span className="block text-xs">Only you can see this</span>
                    </p>
                  )
                )}
                <a
                  href={product.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-lg bg-gold-fill px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
                >
                  Visit website
                </a>
                <ShareButton title={product.name} />
                {canEdit && (
                  <Link
                    href={`/dashboard/products/${product.slug}/edit`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
