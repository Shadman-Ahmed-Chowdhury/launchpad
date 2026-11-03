"use client";

import { useActionState, useState } from "react";
import {
  approveProductAction,
  rejectProductAction,
  requestChangesProductAction,
} from "@/app/actions/reviews";
import type { AuthFormState } from "@/lib/action-state";

type Mode = null | "reject" | "changes";

/**
 * A reviewer's three decisions on one queued product. Approve posts
 * immediately; reject/request-changes reveal a required reason textarea
 * first (see ReviewProductRequest on the backend).
 */
export function ReviewActions({ slug }: { slug: string }) {
  const [mode, setMode] = useState<Mode>(null);

  const [approveState, approveFormAction, approvePending] = useActionState<
    AuthFormState,
    FormData
  >(approveProductAction.bind(null, slug), undefined);

  const [rejectState, rejectFormAction, rejectPending] = useActionState<
    AuthFormState,
    FormData
  >(rejectProductAction.bind(null, slug), undefined);

  const [changesState, changesFormAction, changesPending] = useActionState<
    AuthFormState,
    FormData
  >(requestChangesProductAction.bind(null, slug), undefined);

  if (mode === "reject" || mode === "changes") {
    const isReject = mode === "reject";
    const formAction = isReject ? rejectFormAction : changesFormAction;
    const pending = isReject ? rejectPending : changesPending;
    const state = isReject ? rejectState : changesState;

    return (
      <form action={formAction} className="mt-4 space-y-2">
        <textarea
          name="notes"
          required
          rows={3}
          placeholder={isReject ? "Why is this rejected?" : "What needs to change?"}
          className="w-full resize-none border-b border-hairline bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        {state?.errors?.notes && <p className="text-sm text-danger">{state.errors.notes[0]}</p>}
        {state?.message && <p className="text-sm text-danger">{state.message}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-gold-fill px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
          >
            {pending ? "Sending…" : isReject ? "Reject" : "Send back for changes"}
          </button>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <form action={approveFormAction}>
        <button
          type="submit"
          disabled={approvePending}
          className="rounded-full bg-gold-fill px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
        >
          {approvePending ? "Approving…" : "Approve"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode("changes")}
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        Request changes
      </button>
      <button
        type="button"
        onClick={() => setMode("reject")}
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        Reject
      </button>
      {approveState?.message && <p className="text-sm text-danger">{approveState.message}</p>}
    </div>
  );
}
