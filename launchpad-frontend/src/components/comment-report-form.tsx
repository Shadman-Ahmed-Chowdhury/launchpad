"use client";

import { useActionState, useState } from "react";
import { reportCommentAction } from "@/app/actions/comments";
import { FlagIcon } from "@/components/icons";
import type { AuthFormState } from "@/lib/action-state";

/**
 * A "Report" toggle that reveals an inline reason form, same
 * expand-on-click interaction `CommentThread` already uses for "Reply".
 * Once reported, stays showing "Reported" instead of letting the member
 * file a second one — the backend would reject it anyway (`CommentPolicy::
 * report()`), but there's no reason to round-trip for that.
 */
export function CommentReportForm({
  slug,
  commentId,
  reportedByViewer,
}: {
  slug: string;
  commentId: number;
  reportedByViewer: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = reportCommentAction.bind(null, slug, commentId);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);

  const reported = reportedByViewer || state?.success;

  if (reported) {
    return <span className="text-xs text-muted">Reported</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-danger"
      >
        <FlagIcon className="h-3.5 w-3.5" />
        Report
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <textarea
        name="reason"
        rows={2}
        required
        maxLength={500}
        autoFocus
        placeholder="Why are you reporting this comment?"
        className="w-full resize-none rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold"
      />
      {state?.errors?.reason && <p className="text-sm text-danger">{state.errors.reason[0]}</p>}
      {!state?.success && state?.message && <p className="text-sm text-danger">{state.message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
        >
          {pending ? "Reporting…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
