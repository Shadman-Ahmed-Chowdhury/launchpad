"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-10 space-y-6">
      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="firstName" className="text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="Ada"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.first_name && (
            <p className="mt-2 text-sm text-danger">{state.errors.first_name[0]}</p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Lovelace"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.last_name && (
            <p className="mt-2 text-sm text-danger">{state.errors.last_name[0]}</p>
          )}
        </div>
      </div>

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
          <p className="mt-2 text-sm text-danger">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
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
          Confirm password
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
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
