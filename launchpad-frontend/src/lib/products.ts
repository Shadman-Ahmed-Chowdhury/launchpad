import rawProducts from "@/data/products.json";
import type { Product } from "@/types";

interface RawProduct {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: string | null;
  topics: string[];
  website_url: string;
  votes_count: number;
  launch_date: string;
}

/**
 * `products.json` is shaped like a Django REST Framework list response
 * (snake_case, matching docs/04-db-diagram.md) so that swapping this for
 * `apiFetch<RawProduct[]>("/api/products/")` later is a one-line change —
 * everything downstream already consumes the mapped `Product` type.
 */
function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    tagline: raw.tagline,
    description: raw.description,
    logo: raw.logo,
    topics: raw.topics,
    websiteUrl: raw.website_url,
    votesCount: raw.votes_count,
    launchDate: raw.launch_date,
  };
}

export function getProducts(): Product[] {
  return (rawProducts as RawProduct[])
    .map(mapProduct)
    .sort((a, b) => b.votesCount - a.votesCount);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((product) => product.slug === slug);
}
