/**
 * Small pill used to show a product's topics — on the home/list cards and
 * the product detail page, so a topic reads the same everywhere.
 */
export function TopicTag({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}
