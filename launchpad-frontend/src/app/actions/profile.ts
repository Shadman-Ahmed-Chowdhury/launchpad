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

  const links = parseLinks(formData.get("links"));
  const avatar = formData.get("avatar");

  // Always multipart: the avatar is a file, and a browser form can't send a
  // real PATCH with a file body — Laravel's `_method` spoofing is the
  // standard way around that (same trick Blade's @method('PATCH') uses).
  const payload = new FormData();
  payload.append("_method", "PATCH");
  payload.append("first_name", String(formData.get("firstName") ?? ""));
  payload.append("last_name", String(formData.get("lastName") ?? ""));
  payload.append("handle", String(formData.get("handle") ?? ""));
  payload.append("bio", String(formData.get("bio") ?? ""));
  links.forEach((link, index) => {
    payload.append(`links[${index}][label]`, link.label);
    payload.append(`links[${index}][url]`, link.url);
  });
  if (avatar instanceof File && avatar.size > 0) {
    payload.append("avatar", avatar);
  }

  try {
    await apiFetch("/api/me", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong saving your profile.") };
  }

  return { message: "saved" };
}
