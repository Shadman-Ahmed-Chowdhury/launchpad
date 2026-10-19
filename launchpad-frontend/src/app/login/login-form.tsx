"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="mt-10 space-y-6">
      <input type="hidden" name="next" value={next} />

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
          <p className="mt-2 text-sm text-danger">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Forgot?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        {state?.errors?.password && (
          <p className="mt-2 text-sm text-danger">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
