"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, type AuthFormState } from "@/lib/action-state";

/**
 * Votes show up on the homepage, the full list, and a product's own page —
 * revalidate all three rather than threading the current path through
 * `VoteButton` just to revalidate one of them.
 */
function revalidateVoteSurfaces(slug: string): void {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
}

/**
 * Bound to a product's slug (see `VoteButton`'s `.bind(null, slug)`), same
 * pattern `updateProductAction` uses for passing extra arguments.
 */
export async function castVoteAction(
  slug: string,
  // useActionState requires this signature; the button has nothing to submit.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);

  try {
    await apiFetch(`/api/products/${slug}/votes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong casting your vote.") };
  }

  revalidateVoteSurfaces(slug);
  return undefined;
}

export async function retractVoteAction(
  slug: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);

  try {
    await apiFetch(`/api/products/${slug}/votes`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong removing your vote.") };
  }

  revalidateVoteSurfaces(slug);
  return undefined;
}
