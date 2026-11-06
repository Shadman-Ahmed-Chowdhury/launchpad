"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { castVoteAction, retractVoteAction } from "@/app/actions/votes";
import { ChevronUpIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";
import type { AuthFormState } from "@/lib/action-state";

const BASE_CLASSES = "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors";

const VARIANT_CLASSES = {
  pill: "px-3 py-2 text-sm",
  block: "w-full justify-center px-4 py-3 text-sm",
};

function pillTone(active: boolean, interactive: boolean) {
  if (active) return "border-gold bg-gold-fill text-background";
  if (!interactive) return "border-hairline text-muted";
  return "border-hairline text-foreground hover:border-gold hover:text-gold";
}

/**
 * `label` and `votesCount` are adjacent text expressions — without an
 * element boundary between them, flexbox's `gap` has nothing to space, so
 * they'd render stuck together ("Upvoted28"). A middot separator fixes the
 * spacing and doubles as the "Upvoted · N" treatment the sidebar wants.
 */
function VoteButtonContent({ label, votesCount }: { label: string | null; votesCount: number }) {
  return (
    <>
      <ChevronUpIcon className="h-4 w-4" />
      {label && <span>{label}</span>}
      {label && <span className="opacity-50">·</span>}
      <span>{votesCount}</span>
    </>
  );
}

/**
 * One vote per member per product; they can take it back; nobody votes on
 * their own product (see docs/01-client-brief.md "Voting and comments").
 * `disabled` covers the own-product case — the backend would 403 it anyway
 * (with a specific message, see ProductPolicy::vote()), but a disabled
 * button avoids a round trip that can only fail.
 *
 * `readOnly` renders the same pill as a plain link to the product page
 * instead of a form — used on list pages for signed-out visitors, who can't
 * vote inline and should land on the product page to sign in from there.
 *
 * `variant`: "pill" (default) is the compact icon+count badge used on list
 * cards; "block" is the full-width, labeled button used in the product
 * page's action sidebar.
 */
export function VoteButton({
  slug,
  votesCount,
  votedByViewer,
  disabled = false,
  readOnly = false,
  variant = "pill",
}: {
  slug: string;
  votesCount: number;
  votedByViewer: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  variant?: "pill" | "block";
}) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`;
  const label = variant === "block" ? (votedByViewer ? "Upvoted" : "Upvote") : null;

  if (readOnly) {
    return (
      <Link href={`/products/${slug}`} className={`${classes} ${pillTone(false, true)}`}>
        <VoteButtonContent label={label} votesCount={votesCount} />
      </Link>
    );
  }

  return (
    <VoteForm
      slug={slug}
      votesCount={votesCount}
      votedByViewer={votedByViewer}
      disabled={disabled}
      classes={classes}
      label={label}
    />
  );
}

function VoteForm({
  slug,
  votesCount,
  votedByViewer,
  disabled,
  classes,
  label,
}: {
  slug: string;
  votesCount: number;
  votedByViewer: boolean;
  disabled: boolean;
  classes: string;
  label: string | null;
}) {
  const action = (votedByViewer ? retractVoteAction : castVoteAction).bind(null, slug);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );
  const toast = useToast();

  // Surface the action's result as a toast instead of inline text — a 403
  // like "You can't vote on your own product." under a small list-card
  // button broke the layout. `state` only changes reference when a new
  // dispatch resolves, and `toast` is stable (see useToast), so this fires
  // exactly once per vote/unvote attempt.
  useEffect(() => {
    if (!state?.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state, toast]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={disabled || pending}
        aria-pressed={votedByViewer}
        className={`${classes} ${pillTone(votedByViewer, true)} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <VoteButtonContent label={label} votesCount={votesCount} />
      </button>
    </form>
  );
}
