"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader nav={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {sent ? (
            <>
              <h1 className="font-display text-3xl tracking-tight">
                Check your email
              </h1>
              <p className="mt-2 text-muted">
                If an account uses that address, a reset link is on its way.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl tracking-tight">
                Reset your password
              </h1>
              <p className="mt-2 text-muted">
                We&apos;ll email you a link to set a new one.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setSent(true);
                }}
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

                <button
                  type="submit"
                  className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
                >
                  Send reset link
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-sm text-muted">
            <Link
              href="/login"
              className="text-foreground underline underline-offset-4 hover:text-gold"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
