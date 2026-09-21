"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader nav={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-muted">
            Join to vote, comment, and launch your own product.
          </p>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="mt-10 space-y-6"
          >
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
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
            >
              Create account
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground underline underline-offset-4 hover:text-gold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
