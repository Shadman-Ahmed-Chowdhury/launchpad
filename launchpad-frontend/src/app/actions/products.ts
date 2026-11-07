"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, fieldErrors, type AuthFormState } from "@/lib/action-state";

/**
 * Screenshots show up on the product page, the dashboard edit form, and the
 * reviewer queue — revalidate all three after an add/remove.
 */
function revalidateScreenshotSurfaces(slug: string): void {
  revalidatePath(`/products/${slug}`);
  revalidatePath(`/dashboard/products/${slug}/edit`);
  revalidatePath("/staff");
}

/**
 * Builds the multipart body shared by create/update — screenshots are
 * files, so the whole request goes as `FormData` rather than JSON (same
 * trick `updateProfileAction` uses for the avatar).
 */
function buildProductPayload(formData: FormData): FormData {
  const topicIds = formData
    .getAll("topic_ids")
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  const payload = new FormData();
  payload.append("name", String(formData.get("name") ?? ""));
  payload.append("tagline", String(formData.get("tagline") ?? ""));
  payload.append("description", String(formData.get("description") ?? ""));
  payload.append("website_url", String(formData.get("websiteUrl") ?? ""));
  topicIds.forEach((id) => payload.append("topic_ids[]", String(id)));

  formData.getAll("screenshots").forEach((file) => {
    if (file instanceof File && file.size > 0) {
      payload.append("screenshots[]", file);
    }
  });

  return payload;
}

export async function createProductAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch("/api/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: buildProductPayload(formData),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong submitting your product.") };
  }

  redirect("/dashboard/products");
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

  // A browser can't send a real PATCH with a file body — Laravel's
  // `_method` spoofing is the standard way around that (same trick
  // `updateProfileAction` uses for the avatar).
  const payload = buildProductPayload(formData);
  payload.append("_method", "PATCH");

  try {
    await apiFetch(`/api/products/${slug}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong saving your product.") };
  }

  redirect(`/products/${slug}`);
}

/**
 * Submits a draft (or a product sent back for changes) into the reviewer
 * queue. Bound to a slug the same way `updateProductAction` is.
 */
/**
 * Picks (or changes) a product's launch day, once it's `approved` (see
 * ADR-027). Bound to a slug the same way `updateProductAction` is.
 */
export async function scheduleLaunchAction(
  slug: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/products/${slug}/schedule`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ launch_date: formData.get("launchDate") }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong setting your launch day.") };
  }

  redirect("/dashboard/products");
}

/**
 * Appends up to the remaining slots (3 total, see ADR-036) to a product's
 * screenshot set. Bound to a slug the same way `updateProductAction` is —
 * called directly from `ScreenshotManager` on file selection, not from a
 * traditional field-by-field form.
 */
export async function addScreenshotAction(
  slug: string,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const payload = new FormData();
  formData.getAll("screenshots").forEach((file) => {
    if (file instanceof File && file.size > 0) {
      payload.append("screenshots[]", file);
    }
  });

  try {
    await apiFetch(`/api/products/${slug}/screenshots`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors, message: errors.screenshots?.[0] };
    return { message: errorMessage(error, "Something went wrong adding the screenshot.") };
  }

  revalidateScreenshotSurfaces(slug);
  return { success: true };
}

/**
 * Removes one screenshot. Bound to both the slug and the screenshot's id
 * (see `ScreenshotManager`'s `.bind(null, slug, screenshot.id)`).
 */
export async function removeScreenshotAction(
  slug: string,
  screenshotId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch(`/api/products/${slug}/screenshots/${screenshotId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong removing the screenshot.") };
  }

  revalidateScreenshotSurfaces(slug);
  return { success: true };
}

export async function submitProductAction(
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
    await apiFetch(`/api/products/${slug}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong submitting your product for review.") };
  }

  redirect("/dashboard/products");
}
