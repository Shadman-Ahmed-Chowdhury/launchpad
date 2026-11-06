import { apiFetch, ApiError } from "@/lib/api-client";
import { mapProduct, type RawProduct } from "@/lib/products";
import { getAuthToken } from "@/lib/session";
import type { Product, PublicProfile, UserLink } from "@/types";

interface RawPublicProfile {
  handle: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  avatar_url: string | null;
  links: UserLink[];
  member_since: string;
  products_count: number;
  votes_received_count: number;
}

function mapPublicProfile(raw: RawPublicProfile): PublicProfile {
  return {
    handle: raw.handle,
    firstName: raw.first_name,
    lastName: raw.last_name,
    bio: raw.bio,
    avatarUrl: raw.avatar_url,
    links: raw.links,
    memberSince: raw.member_since,
    productsCount: raw.products_count,
    votesReceivedCount: raw.votes_received_count,
  };
}

/**
 * A member's public profile by handle, or `undefined` for an unknown handle
 * (see `ProfileController::show()`). No auth needed — this is a public page.
 */
export async function getPublicProfile(handle: string): Promise<PublicProfile | undefined> {
  try {
    const { data } = await apiFetch<{ data: RawPublicProfile }>(`/api/users/${handle}`);
    return mapPublicProfile(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

/**
 * A member's launched products, for the public profile's product list.
 * Sends the viewer's token when there is one (same optional-auth pattern as
 * `getProducts()` in src/lib/products.ts) so `votedByViewer` is accurate for
 * a signed-in visitor, and `founder` is populated so `ProductCard` can tell
 * a member apart from their own product when viewing their own profile.
 */
export async function getMemberProducts(handle: string): Promise<Product[]> {
  const token = await getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data } = await apiFetch<{ data: RawProduct[] }>(`/api/users/${handle}/products`, {
    headers,
  });

  return data.map(mapProduct);
}

export interface AdminMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isSuspended: boolean;
}

interface RawMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_suspended: boolean;
}

/**
 * The current plain-member accounts — admin-only (see ADR-028). Returns an
 * empty list if there's no session; the page itself gates access via
 * `requireAdmin()`.
 */
export async function getMembers(): Promise<AdminMember[]> {
  const token = await getAuthToken();
  if (!token) return [];

  const { data } = await apiFetch<{ data: RawMember[] }>("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data.map((raw) => ({
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email,
    isSuspended: raw.is_suspended,
  }));
}
