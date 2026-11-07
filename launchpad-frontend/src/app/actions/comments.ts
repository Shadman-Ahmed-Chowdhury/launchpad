"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { errorMessage, fieldErrors, type AuthFormState } from "@/lib/action-state";

/**
 * Posts a top-level comment, or a reply when `parentCommentId` is set
 * (bound via `.bind(null, slug, parentCommentId)`, same pattern
 * `castVoteAction` uses for the product slug).
 */
export async function postCommentAction(
  slug: string,
  parentCommentId: number | null,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/products/${slug}#comments`)}`);

  const body = formData.get("body");

  try {
    await apiFetch(`/api/products/${slug}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body, parent_comment_id: parentCommentId }),
    });
  } catch (error) {
    return {
      errors: fieldErrors(error),
      message: errorMessage(error, "Something went wrong posting your comment."),
    };
  }

  revalidatePath(`/products/${slug}`);
  return { success: true };
}

/**
 * Likes a comment or reply (bound via `.bind(null, slug, commentId)`, same
 * pattern `postCommentAction` uses). `slug` is only needed to revalidate
 * the product page afterward — the API itself targets the comment by id.
 */
export async function likeCommentAction(
  slug: string,
  commentId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/products/${slug}#comments`)}`);

  try {
    await apiFetch(`/api/comments/${commentId}/likes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong liking that comment.") };
  }

  revalidatePath(`/products/${slug}`);
  return { success: true };
}

export async function unlikeCommentAction(
  slug: string,
  commentId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/products/${slug}#comments`)}`);

  try {
    await apiFetch(`/api/comments/${commentId}/likes`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong removing your like.") };
  }

  revalidatePath(`/products/${slug}`);
  return { success: true };
}

/**
 * Reports a comment or reply, with the reason from the inline report form
 * (see `CommentReportForm`). Unlike like/unlike, a successful report keeps
 * its `message` so the form can show "Reported" instead of just closing —
 * compare `castVoteAction`, which also returns a message for its toast.
 */
export async function reportCommentAction(
  slug: string,
  commentId: number,
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/products/${slug}#comments`)}`);

  const reason = formData.get("reason");
  let message = "Comment reported.";

  try {
    const response = await apiFetch<{ message: string | null }>(`/api/comments/${commentId}/reports`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
    message = response.message ?? message;
  } catch (error) {
    return {
      errors: fieldErrors(error),
      message: errorMessage(error, "Something went wrong reporting that comment."),
    };
  }

  revalidatePath(`/products/${slug}`);
  return { message, success: true };
}
