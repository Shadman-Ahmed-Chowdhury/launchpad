import Link from "next/link";
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
  const isOwnProduct = currentUserId !== undefined && product.founder?.id === currentUserId;

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
        </div>
      </Link>

      <VoteButton
        slug={product.slug}
        votesCount={product.votesCount}
        votedByViewer={product.votedByViewer}
        disabled={isOwnProduct}
      />
    </div>
  );
}
