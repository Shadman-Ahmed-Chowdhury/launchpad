import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import type { AuthProvider, User, UserLink, UserRole } from "@/types";

interface RawAuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  handle: string;
  auth_provider: AuthProvider;
  role: UserRole;
  bio: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  links: UserLink[];
  created_at: string;
}

function mapUser(raw: RawAuthUser): User {
  return {
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email,
    handle: raw.handle,
    authProvider: raw.auth_provider,
    role: raw.role,
    bio: raw.bio,
    avatarUrl: raw.avatar_url,
    emailVerified: raw.email_verified,
    links: raw.links,
    createdAt: raw.created_at,
  };
}

/**
 * The signed-in member, or `null` if there's no session (or it's expired).
 * Memoized per request (see Next's DAL pattern) since layouts, pages, and
 * leaf components may all ask for it during one render pass.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const { data } = await apiFetch<{ data: RawAuthUser }>("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return mapUser(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
});

/**
 * Use in Server Components for routes that require a signed-in member —
 * redirects to /login (with a return path) instead of rendering.
 */
export async function requireUser(redirectTo: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

/**
 * Use in Server Components for staff-only routes (reviewer or admin) — a
 * signed-out visitor is redirected to log in, but a signed-in member who
 * isn't staff gets a 404 instead of a redirect, so `/staff` doesn't reveal
 * it exists to someone who can't use it.
 */
export async function requireStaff(redirectTo: string): Promise<User> {
  const user = await requireUser(redirectTo);

  if (user.role === "member") {
    notFound();
  }

  return user;
}

/**
 * Use in Server Components for admin-only routes — same 404-not-redirect
 * reasoning as `requireStaff()`, but for `role === "admin"` specifically
 * (creating reviewer accounts is admin-only, see ADR-026).
 */
export async function requireAdmin(redirectTo: string): Promise<User> {
  const user = await requireUser(redirectTo);

  if (user.role !== "admin") {
    notFound();
  }

  return user;
}

/**
 * Use in Server Components for routes only a signed-out visitor should see
 * (login, signup) — redirects a signed-in member away instead of rendering.
 */
export async function redirectIfAuthenticated(to: string): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    redirect(to);
  }
}
