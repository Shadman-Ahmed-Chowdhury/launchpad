import { apiFetch, ApiError } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import type { Comment, CommentAuthor } from "@/types";

interface RawCommentAuthor {
  id: number;
  name: string;
  handle: string;
  avatar_url: string | null;
}

interface RawComment {
  id: number;
  body: string;
  parent_comment_id: number | null;
  created_at: string;
  author: RawCommentAuthor;
  likes_count: number;
  liked_by_viewer: boolean;
  reported_by_viewer: boolean;
  replies?: RawComment[];
}

function mapAuthor(raw: RawCommentAuthor): CommentAuthor {
  return {
    id: raw.id,
    name: raw.name,
    handle: raw.handle,
    avatarUrl: raw.avatar_url,
  };
}

export function mapComment(raw: RawComment): Comment {
  return {
    id: raw.id,
    body: raw.body,
    parentCommentId: raw.parent_comment_id,
    createdAt: raw.created_at,
    author: mapAuthor(raw.author),
    likesCount: raw.likes_count,
    likedByViewer: raw.liked_by_viewer,
    reportedByViewer: raw.reported_by_viewer,
    replies: (raw.replies ?? []).map(mapComment),
  };
}

/**
 * Top-level comments on a product (with their replies nested), newest
 * first — public (no auth needed), but sends the viewer's token when there
 * is one so `likedByViewer`/`reportedByViewer` come back accurate for a
 * signed-in member (see `CommentController::index()`, same optional-auth
 * shape as `getProductBySlug()`'s `authHeaders()`). Returns an empty list
 * for a slug that doesn't exist, same null-safety as `getProductBySlug()`
 * — the page itself calls `notFound()` once it checks the product.
 */
export async function getComments(slug: string): Promise<Comment[]> {
  const token = await getAuthToken();

  try {
    const { data } = await apiFetch<{ data: RawComment[] }>(
      `/api/products/${slug}/comments`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    );

    return data.map(mapComment);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }

    throw error;
  }
}
