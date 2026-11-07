import { apiFetch, ApiError } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import type {
  Pagination,
  Product,
  ProductScreenshot,
  ProductStatus,
  Topic,
} from "@/types";

/**
 * Shared by the products list and detail pages so a status reads the same
 * in both places.
 */
export const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  approved: "Approved",
  scheduled: "Scheduled",
  launched: "Launched",
  taken_down: "Taken down",
};

interface RawProductFounder {
  id: number;
  name: string;
  handle: string;
}

interface RawProductReview {
  action: ProductStatus;
  notes: string | null;
  created_at: string;
}

export interface RawProduct {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: string | null;
  topics: string[];
  screenshots?: ProductScreenshot[];
  website_url: string;
  status: ProductStatus;
  votes_count: number;
  voted_by_viewer: boolean;
  comments_count: number;
  launch_date: string;
  submitted_at: string | null;
  founder?: RawProductFounder;
  latest_review?: RawProductReview;
}

interface RawTopic {
  id: number;
  name: string;
  slug: string;
}

interface RawMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    tagline: raw.tagline,
    description: raw.description,
    logo: raw.logo,
    topics: raw.topics,
    screenshots: raw.screenshots ?? [],
    websiteUrl: raw.website_url,
    status: raw.status,
    votesCount: raw.votes_count,
    votedByViewer: raw.voted_by_viewer,
    commentsCount: raw.comments_count,
    launchDate: raw.launch_date,
    submittedAt: raw.submitted_at,
    founder: raw.founder,
    latestReview: raw.latest_review
      ? {
          action: raw.latest_review.action,
          notes: raw.latest_review.notes,
          createdAt: raw.latest_review.created_at,
        }
      : undefined,
  };
}

/**
 * Both public product views send the viewer's token when there is one, even
 * though the route itself has no `auth:sanctum` middleware — it's optional
 * auth (see `ProductController@show`), used only to flag `votedByViewer` on
 * each product for a signed-in member (see ADR-029).
 */
async function authHeaders(): Promise<RequestInit> {
  const token = await getAuthToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export interface ProductListParams {
  q?: string;
  /** Topic slugs — OR-matched (see ADR-040), sent as one comma-separated param. */
  topics?: string[];
  sort?: "newest" | "votes";
  /** Launch date range, `YYYY-MM-DD` (see ADR-040). */
  from?: string;
  to?: string;
  page?: number;
}

/**
 * The product list page's search/topic-filter/date-range/sort (see
 * ADR-039/ADR-040) — the backend owns ordering now, so this no longer
 * re-sorts client-side the way it used to.
 */
export async function getProducts(
  params: ProductListParams = {},
): Promise<{ products: Product[]; pagination: Pagination }> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.topics?.length) query.set("topics", params.topics.join(","));
  if (params.sort) query.set("sort", params.sort);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page) query.set("page", String(params.page));

  const queryString = query.toString();

  const { data, meta } = await apiFetch<{ data: RawProduct[]; meta: RawMeta }>(
    `/api/products${queryString ? `?${queryString}` : ""}`,
    await authHeaders(),
  );

  return {
    products: data.map(mapProduct),
    pagination: {
      currentPage: meta.current_page,
      lastPage: meta.last_page,
      total: meta.total,
      perPage: meta.per_page,
    },
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    const { data } = await apiFetch<{ data: RawProduct }>(
      `/api/products/${slug}`,
      await authHeaders(),
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
 * The reviewer queue: products waiting for a decision, oldest submission
 * first (see docs/01-client-brief.md "staff tools"). Returns an empty list
 * if there's no session — the page itself gates access via `requireStaff()`.
 */
export async function getReviewQueue(): Promise<Product[]> {
  const token = await getAuthToken();
  if (!token) return [];

  const { data } = await apiFetch<{ data: RawProduct[] }>("/api/reviewer/products", {
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
 * A product the signed-in founder owns, any status — powers the dashboard
 * product detail and edit pages. Unlike `getProductBySlug()`, this sends
 * the founder's token so a draft (not yet public) can be previewed/edited
 * by its own founder.
 */
export async function getMyProductBySlug(
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
