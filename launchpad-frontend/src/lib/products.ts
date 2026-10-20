import { apiFetch, ApiError } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import type { Product, ProductStatus, Topic } from "@/types";

interface RawProduct {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: string | null;
  topics: string[];
  website_url: string;
  status: ProductStatus;
  votes_count: number;
  launch_date: string;
}

interface RawTopic {
  id: number;
  name: string;
  slug: string;
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
    status: raw.status,
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

/**
 * The signed-in founder's own products, any status — powers the dashboard.
 * Returns an empty list if there's no session, same null-safety as
 * `getCurrentUser()` in src/lib/auth.ts.
 */
export async function getMyProducts(): Promise<Product[]> {
  const token = await getAuthToken();
  if (!token) return [];

  const { data } = await apiFetch<{ data: RawProduct[] }>("/api/me/products", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data.map(mapProduct);
}

/**
 * The fixed topic taxonomy, for the add-product form's topic checkboxes.
 */
export async function getTopics(): Promise<Topic[]> {
  const { data } = await apiFetch<{ data: RawTopic[] }>("/api/topics");

  return data;
}

/**
 * A product the signed-in founder owns, any status — powers the edit page.
 * Unlike `getProductBySlug()`, this sends the founder's token so a draft
 * (not yet public) can be previewed/edited by its own founder.
 */
export async function getProductForEdit(
  slug: string,
): Promise<Product | undefined> {
  const token = await getAuthToken();
  if (!token) return undefined;

  try {
    const { data } = await apiFetch<{ data: RawProduct }>(
      `/api/products/${slug}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return mapProduct(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }

    throw error;
  }
}
