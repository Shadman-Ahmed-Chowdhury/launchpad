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
