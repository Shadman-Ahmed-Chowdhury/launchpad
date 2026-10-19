"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, fieldErrors, type AuthFormState } from "@/lib/action-state";

export async function createProductAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const topicIds = formData
    .getAll("topic_ids")
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  try {
    await apiFetch("/api/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: formData.get("name"),
        tagline: formData.get("tagline"),
        description: formData.get("description"),
        website_url: formData.get("websiteUrl"),
        topic_ids: topicIds,
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong submitting your product.") };
  }

  redirect("/dashboard");
}

/**
 * Bound to a product's slug (see `ProductForm`'s `.bind(null, slug)`) before
 * being handed to `useActionState` — same pattern Next.js docs use for
 * passing extra arguments to a Server Action used in a form.
 */
export async function updateProductAction(
  slug: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const topicIds = formData
    .getAll("topic_ids")
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  try {
    await apiFetch(`/api/products/${slug}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: formData.get("name"),
        tagline: formData.get("tagline"),
        description: formData.get("description"),
        website_url: formData.get("websiteUrl"),
        topic_ids: topicIds,
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong saving your product.") };
  }

  redirect("/dashboard");
}
