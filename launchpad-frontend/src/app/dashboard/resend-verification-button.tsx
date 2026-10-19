"use client";

import { useActionState } from "react";
import { resendVerificationAction, type AuthFormState } from "@/app/actions/auth";

export function ResendVerificationButton() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resendVerificationAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-2 flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-gold disabled:opacity-60"
      >
        {pending ? "Sending…" : "Resend verification email"}
      </button>
      {state?.message && <span className="text-sm text-muted">{state.message}</span>}
    </form>
  );
}
