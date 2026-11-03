import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import type { User } from "@/types";

interface RawReviewer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  handle: string;
}

function mapReviewer(raw: RawReviewer): Pick<User, "id" | "firstName" | "lastName" | "email" | "handle"> {
  return {
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email,
    handle: raw.handle,
  };
}

/**
 * The current reviewer accounts — admin-only (see ADR-026). Returns an
 * empty list if there's no session; the page itself gates access via
 * `requireAdmin()`.
 */
export async function getReviewers() {
  const token = await getAuthToken();
  if (!token) return [];

  const { data } = await apiFetch<{ data: RawReviewer[] }>("/api/admin/reviewers", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data.map(mapReviewer);
}
