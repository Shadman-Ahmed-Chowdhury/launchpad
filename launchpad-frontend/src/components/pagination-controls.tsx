import Link from "next/link";

interface PaginationSearchParams {
  q?: string;
  topics?: string;
  sort?: string;
  from?: string;
  to?: string;
}

function hrefForPage(page: number, searchParams: PaginationSearchParams) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.topics) params.set("topics", searchParams.topics);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.from) params.set("from", searchParams.from);
  if (searchParams.to) params.set("to", searchParams.to);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return `/products${query ? `?${query}` : ""}`;
}

/**
 * Prev/Next for the product list page (see ADR-039/ADR-040) — plain
 * `<Link>`s, no client JS needed, carrying the current
 * `q`/`topics`/`sort`/`from`/`to` through to the next/previous page.
 */
export function PaginationControls({
  currentPage,
  lastPage,
  searchParams,
}: {
  currentPage: number;
  lastPage: number;
  searchParams: PaginationSearchParams;
}) {
  if (lastPage <= 1) return null;

  return (
    <nav
      className="mt-10 flex items-center justify-between text-sm"
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={hrefForPage(currentPage - 1, searchParams)}
          className="text-muted transition-colors hover:text-foreground"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-muted">
        Page {currentPage} of {lastPage}
      </span>

      {currentPage < lastPage ? (
        <Link
          href={hrefForPage(currentPage + 1, searchParams)}
          className="text-muted transition-colors hover:text-foreground"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
