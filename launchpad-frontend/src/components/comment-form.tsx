"use client";

import { useActionState, useEffect, useRef } from "react";
import { postCommentAction } from "@/app/actions/comments";
import type { AuthFormState } from "@/lib/action-state";

/**
 * Posts a top-level comment (`parentCommentId` omitted/null), or a reply
 * when rendered under a comment's "Reply" toggle (see `CommentThread`).
 */
export function CommentForm({
  slug,
  parentCommentId = null,
  autoFocus = false,
  placeholder = "Add a comment",
}: {
  slug: string;
  parentCommentId?: number | null;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const action = postCommentAction.bind(null, slug, parentCommentId);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <textarea
        name="body"
        rows={parentCommentId ? 2 : 3}
        required
        maxLength={2000}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold"
      />
      {state?.errors?.body && (
        <p className="text-sm text-danger">{state.errors.body[0]}</p>
      )}
      {!state?.success && state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold-fill px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
      >
        {pending ? "Posting…" : parentCommentId ? "Post reply" : "Post comment"}
      </button>
    </form>
  );
}
