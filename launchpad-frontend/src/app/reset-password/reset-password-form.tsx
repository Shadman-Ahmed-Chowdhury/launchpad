"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type AuthFormState } from "@/app/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    undefined,
  );

  if (state?.message === "reset") {
    return (
      <>
        <h1 className="font-display text-3xl tracking-tight">
          Password reset
        </h1>
        <p className="mt-2 text-muted">
          Your password has been changed. You can sign in with it now.
        </p>
        <p className="mt-8 text-sm text-muted">
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 hover:text-gold"
          >
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">
        Set a new password
      </h1>
      <p className="mt-2 text-muted">Make it at least 8 characters.</p>

      <form action={formAction} className="mt-10 space-y-6">
        <input type="hidden" name="token" value={token} />

        {state?.message && (
          <p className="text-sm text-danger">{state.message}</p>
        )}
        {state?.errors?.token && (
          <p className="text-sm text-danger">{state.errors.token[0]}</p>
        )}

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="At least 8 characters"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.password && (
            <p className="mt-2 text-sm text-danger">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="passwordConfirmation" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            required
            placeholder="••••••••"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Set new password"}
        </button>
      </form>
    </>
  );
}
