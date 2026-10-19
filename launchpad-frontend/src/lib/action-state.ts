import { ApiError } from "@/lib/api-client";

/**
 * Shared `useActionState` result shape for every form action. Lives outside
 * any "use server" file — Next.js requires every export of a "use server"
 * module to be an async Server Action itself, so these plain helpers can't
 * live in src/app/actions/*.ts alongside the actions that use them.
 */
export type AuthFormState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
    }
  | undefined;

export function fieldErrors(error: unknown): Record<string, string[]> | undefined {
  if (error instanceof ApiError && typeof error.body === "object" && error.body !== null) {
    return (error.body as { errors?: Record<string, string[]> }).errors;
  }
  return undefined;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && typeof error.body === "object" && error.body !== null) {
    const message = (error.body as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}
