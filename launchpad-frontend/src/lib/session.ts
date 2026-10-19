import { cookies } from "next/headers";

/**
 * Holds the Sanctum plain-text token (see ADR-023). Only ever read/written
 * from Server Actions and Server Components — ADR-021 means there's no
 * shared session with the backend, so this cookie is the only session state
 * the frontend keeps.
 */
const TOKEN_COOKIE = "launchpad_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
}

export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}
