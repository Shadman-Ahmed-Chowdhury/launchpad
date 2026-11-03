"use client";

import { useActionState, useState } from "react";
import { revokeReviewerAction, updateReviewerAction } from "@/app/actions/admin";
import type { AuthFormState } from "@/lib/action-state";
import type { User } from "@/types";

type Reviewer = Pick<User, "id" | "firstName" | "lastName" | "email">;

/**
 * Completes the reviewer CRUD ADR-026 only took to create+list: an inline
 * edit form, and a revoke button (see ADR-028 — revoking reverts the
 * account to a plain member, it doesn't delete it).
 */
export function ReviewerActions({ reviewer }: { reviewer: Reviewer }) {
  const [editing, setEditing] = useState(false);

  const [updateState, updateFormAction, updatePending] = useActionState<
    AuthFormState,
    FormData
  >(updateReviewerAction.bind(null, reviewer.id), undefined);

  const [revokeState, revokeFormAction, revokePending] = useActionState<
    AuthFormState,
    FormData
  >(revokeReviewerAction.bind(null, reviewer.id), undefined);

  if (editing) {
    return (
      <form action={updateFormAction} className="mt-4 space-y-3">
        <div className="flex gap-3">
          <input
            name="firstName"
            defaultValue={reviewer.firstName}
            placeholder="First name"
            className="w-full border-b border-hairline bg-transparent py-2 text-sm outline-none focus:border-gold"
          />
          <input
            name="lastName"
            defaultValue={reviewer.lastName}
            placeholder="Last name"
            className="w-full border-b border-hairline bg-transparent py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <input
          name="email"
          type="email"
          defaultValue={reviewer.email}
          placeholder="Email"
          className="w-full border-b border-hairline bg-transparent py-2 text-sm outline-none focus:border-gold"
        />
        {updateState?.errors &&
          Object.values(updateState.errors).map((messages) => (
            <p key={messages[0]} className="text-sm text-danger">
              {messages[0]}
            </p>
          ))}
        {updateState?.message && <p className="text-sm text-danger">{updateState.message}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updatePending}
            className="rounded-full bg-gold-fill px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
          >
            {updatePending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-4">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        Edit
      </button>
      <form action={revokeFormAction}>
        <button
          type="submit"
          disabled={revokePending}
          className="text-sm text-danger underline underline-offset-4 disabled:opacity-60"
        >
          {revokePending ? "Revoking…" : "Revoke access"}
        </button>
      </form>
      {revokeState?.message && <p className="text-sm text-danger">{revokeState.message}</p>}
    </div>
  );
}
