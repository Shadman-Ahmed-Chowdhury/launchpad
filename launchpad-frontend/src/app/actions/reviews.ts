"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, fieldErrors, type AuthFormState } from "@/lib/action-state";

/**
 * Reviewer decisions on a product in the queue (see
 * src/app/actions/products.ts for the matching founder-side actions). Each
 * is bound to a slug — `.bind(null, slug)` — before being handed to
 * `useActionState`, same pattern as `updateProductAction`.
 */
export async function approveProductAction(
  slug: string,
  // useActionState requires this signature; the button has nothing to submit.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/reviewer/products/${slug}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong approving this product.") };
  }

  redirect("/staff");
}

export async function rejectProductAction(
  slug: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/reviewer/products/${slug}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: formData.get("notes") }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong rejecting this product.") };
  }

  redirect("/staff");
}

export async function requestChangesProductAction(
  slug: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/reviewer/products/${slug}/request-changes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: formData.get("notes") }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong sending this product back for changes.") };
  }

  redirect("/staff");
}
