"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, fieldErrors, type AuthFormState } from "@/lib/action-state";

/**
 * Admin-only: provisions a reviewer login directly — there's no public
 * signup path to the reviewer role (see ADR-026).
 */
export async function createReviewerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch("/api/admin/reviewers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        password: formData.get("password"),
        password_confirmation: formData.get("passwordConfirmation"),
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong creating this reviewer.") };
  }

  redirect("/staff/reviewers");
}

/**
 * Admin-only: edits a reviewer's name/email. Bound to the reviewer's id —
 * `.bind(null, id)` — same pattern as the product actions' `.bind(null,
 * slug)`.
 */
export async function updateReviewerAction(
  id: number,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/admin/reviewers/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong updating this reviewer.") };
  }

  redirect("/staff/reviewers");
}

/**
 * Admin-only: revokes a reviewer's access — the account itself isn't
 * deleted, it just reverts to a plain member (see ADR-028).
 */
export async function revokeReviewerAction(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/admin/reviewers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong revoking this reviewer's access.") };
  }

  redirect("/staff/reviewers");
}

/**
 * Admin-only: suspends/unsuspends a member (see docs/02-features.md
 * "Admin: can suspend a member"). Bound to the member's id.
 */
export async function suspendUserAction(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/admin/users/${id}/suspend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong suspending this member.") };
  }

  redirect("/staff/users");
}

export async function unsuspendUserAction(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/admin/users/${id}/unsuspend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong unsuspending this member.") };
  }

  redirect("/staff/users");
}
