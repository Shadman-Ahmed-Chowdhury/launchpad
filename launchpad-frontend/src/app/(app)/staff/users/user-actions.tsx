"use client";

import { useActionState } from "react";
import { suspendUserAction, unsuspendUserAction } from "@/app/actions/admin";
import type { AuthFormState } from "@/lib/action-state";

export function UserActions({ id, isSuspended }: { id: number; isSuspended: boolean }) {
  const action = isSuspended ? unsuspendUserAction : suspendUserAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action.bind(null, id),
    undefined,
  );

  return (
    <form action={formAction} className="shrink-0">
      <button
        type="submit"
        disabled={pending}
        className={`text-sm underline underline-offset-4 disabled:opacity-60 ${
          isSuspended ? "text-muted hover:text-foreground" : "text-danger"
        }`}
      >
        {pending ? "Saving…" : isSuspended ? "Unsuspend" : "Suspend"}
      </button>
      {state?.message && <p className="mt-1 text-xs text-danger">{state.message}</p>}
    </form>
  );
}
