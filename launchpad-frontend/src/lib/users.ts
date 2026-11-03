import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";

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
