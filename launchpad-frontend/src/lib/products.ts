import { apiFetch, ApiError } from "@/lib/api-client";
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

export async function getProducts(): Promise<Product[]> {
  const { data } = await apiFetch<{ data: RawProduct[] }>("/api/products");

  return data.map(mapProduct).sort((a, b) => b.votesCount - a.votesCount);
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    const { data } = await apiFetch<{ data: RawProduct }>(
      `/api/products/${slug}`,
    );

    return mapProduct(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }

    throw error;
  }
}
