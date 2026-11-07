"use client";

import { useActionState, useEffect } from "react";
import { likeCommentAction, unlikeCommentAction } from "@/app/actions/comments";
import { HeartIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";
import type { AuthFormState } from "@/lib/action-state";

/**
 * Toggles a like on a comment or reply, same pattern as `VoteButton`
 * (pick the action by current state, surface a rejection as a toast since
 * there's no room for inline text under a small icon+count button).
 */
export function CommentLikeButton({
  slug,
  commentId,
  likesCount,
  likedByViewer,
}: {
  slug: string;
  commentId: number;
  likesCount: number;
  likedByViewer: boolean;
}) {
  const action = (likedByViewer ? unlikeCommentAction : likeCommentAction).bind(null, slug, commentId);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);
  const toast = useToast();

  useEffect(() => {
    if (!state?.message) return;
    toast.error(state.message);
  }, [state, toast]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        aria-pressed={likedByViewer}
        className={`inline-flex items-center gap-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          likedByViewer ? "text-gold" : "text-muted hover:text-gold"
        }`}
      >
        <HeartIcon className="h-3.5 w-3.5" filled={likedByViewer} />
        {likesCount > 0 && <span>{likesCount}</span>}
      </button>
    </form>
  );
}
