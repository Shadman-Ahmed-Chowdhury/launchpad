"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader nav={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-muted">
            Sign in to vote, comment, and follow.
          </p>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="mt-10 space-y-6"
          >
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
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
            >
              Sign in
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4 text-sm text-muted">
            <div className="h-px flex-1 bg-hairline" />
            or
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <button
            type="button"
            className="mt-8 w-full rounded-full border border-hairline px-6 py-3 text-sm font-medium transition-colors hover:border-foreground"
          >
            Continue with Google
          </button>

          <p className="mt-8 text-sm text-muted">
            New here?{" "}
            <Link
              href="/signup"
              className="text-foreground underline underline-offset-4 hover:text-gold"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
