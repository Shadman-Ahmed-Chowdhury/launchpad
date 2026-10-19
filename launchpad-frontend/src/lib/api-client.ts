const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Single entry point for talking to the Laravel API.
 * Pages/components should call this instead of using `fetch` directly.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const raw = response.status === 204 ? "" : await response.text();
  const body =
    raw && contentType.includes("application/json") ? JSON.parse(raw) : raw;

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}
