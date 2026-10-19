"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    forgotPasswordAction,
    undefined,
  );
  const sent = state?.message === "sent";

  if (sent) {
    return (
      <>
        <h1 className="font-display text-3xl tracking-tight">
          Check your email
        </h1>
        <p className="mt-2 text-muted">
          If an account uses that address, a reset link is on its way.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">
        Reset your password
      </h1>
      <p className="mt-2 text-muted">
        We&apos;ll email you a link to set a new one.
      </p>

      <form action={formAction} className="mt-10 space-y-6">
        {state?.message && (
          <p className="text-sm text-danger">{state.message}</p>
        )}

        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.email && (
            <p className="mt-2 text-sm text-danger">
              {state.errors.email[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </>
  );
}
