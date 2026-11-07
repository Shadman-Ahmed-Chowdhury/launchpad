import Link from "next/link";
import { CommentIcon } from "@/components/icons";
import { TopicTag } from "@/components/topic-tag";
import { VoteButton } from "@/components/vote-button";
import type { Product } from "@/types";

export function ProductCard({
  product,
  rank,
  currentUserId,
}: {
  product: Product;
  rank?: number;
  currentUserId?: number;
}) {
  const dark = product.id % 2 === 0;
  const isLoggedIn = currentUserId !== undefined;
  const isOwnProduct = isLoggedIn && product.founder?.id === currentUserId;

  return (
    <div className="flex items-center gap-5 py-6 first:pt-0 last:pb-0">
      {rank !== undefined && (
        <div className="hidden w-6 shrink-0 font-display text-lg text-muted sm:block">
          {rank}
        </div>
      )}

      <Link
        href={`/products/${product.slug}`}
        className="group flex min-w-0 flex-1 items-center gap-5"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-lg ${
            dark ? "bg-foreground text-background" : "bg-gold-fill text-background"
          }`}
        >
          {product.name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium transition-colors group-hover:text-gold">
            {product.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {product.tagline}
          </p>
          {product.topics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.topics.map((topic) => (
                <TopicTag key={topic}>{topic}</TopicTag>
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        <VoteButton
          slug={product.slug}
          votesCount={product.votesCount}
          votedByViewer={product.votedByViewer}
          disabled={isOwnProduct}
          readOnly={!isLoggedIn}
        />
        <Link
          href={`/products/${product.slug}#comments`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-gold hover:text-gold"
        >
          <CommentIcon className="h-4 w-4" />
          {product.commentsCount}
        </Link>
      </div>
    </div>
  );
}
