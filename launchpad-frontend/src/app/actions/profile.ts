"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, fieldErrors, type AuthFormState } from "@/lib/action-state";

function parseLinks(raw: FormDataEntryValue | null): { label: string; url: string }[] {
  if (typeof raw !== "string" || !raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (link): link is { label: string; url: string } =>
        typeof link?.label === "string" && typeof link?.url === "string" && link.label !== "" && link.url !== "",
    );
  } catch {
    return [];
  }
}

export async function updateProfileAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch("/api/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        handle: formData.get("handle"),
        bio: formData.get("bio") || null,
        links: parseLinks(formData.get("links")),
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong saving your profile.") };
  }

  return { message: "saved" };
}
