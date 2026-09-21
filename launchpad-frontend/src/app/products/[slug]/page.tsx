import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getProductBySlug } from "@/lib/products";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-foreground font-display text-2xl text-background">
              {product.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-3xl tracking-tight">
                {product.name}
              </h1>
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

          <div className="mt-10 flex items-center gap-8 border-t border-hairline pt-8">
            <div>
              <div className="font-display text-3xl text-gold">
                {product.votesCount}
              </div>
              <div className="text-xs text-muted">votes</div>
            </div>
            <a
              href={product.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
            >
              Visit website
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
