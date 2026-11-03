"use client";

import { useActionState } from "react";
import { changePasswordAction, type AuthFormState } from "@/app/actions/auth";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    changePasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-10 space-y-6">
      {state?.message && (
        <p className={`text-sm ${state.message === "changed" ? "text-muted" : "text-danger"}`}>
          {state.message === "changed" ? "Password changed." : state.message}
        </p>
      )}

      <div>
        <label htmlFor="currentPassword" className="text-sm font-medium">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        {state?.errors?.current_password && (
          <p className="mt-2 text-sm text-danger">
            {state.errors.current_password[0]}
          </p>
        )}
      </div>

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
          <p className="mt-2 text-sm text-danger">{state.errors.password[0]}</p>
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
          className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
