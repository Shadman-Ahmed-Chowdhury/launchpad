"use client";

import { useActionState } from "react";
import { castVoteAction, retractVoteAction } from "@/app/actions/votes";
import type { AuthFormState } from "@/lib/action-state";

/**
 * One vote per member per product; they can take it back; nobody votes on
 * their own product (see docs/01-client-brief.md "Voting and comments").
 * `disabled` covers the own-product case — the backend would 403 it anyway,
 * but a disabled button avoids a round trip that can only fail.
 */
export function VoteButton({
  slug,
  votesCount,
  votedByViewer,
  disabled = false,
}: {
  slug: string;
  votesCount: number;
  votedByViewer: boolean;
  disabled?: boolean;
}) {
  const action = (votedByViewer ? retractVoteAction : castVoteAction).bind(null, slug);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );

  return (
    <div className="shrink-0 text-right">
      <form action={formAction}>
        <button
          type="submit"
          disabled={disabled || pending}
          aria-pressed={votedByViewer}
          className={`font-display text-2xl transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            votedByViewer ? "text-gold" : "text-foreground enabled:hover:text-gold"
          }`}
        >
          {votesCount}
        </button>
        <div className="text-xs text-muted">{votedByViewer ? "voted" : "votes"}</div>
      </form>
      {state?.message && (
        <p className="mt-1 max-w-[8rem] text-[10px] text-danger">{state.message}</p>
      )}
    </div>
  );
}
