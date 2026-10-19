import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/auth";
import { ResendVerificationButton } from "./resend-verification-button";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">
          Welcome, {user.firstName}
        </h1>
        <p className="mt-2 text-muted">
          Views, votes, traffic, and rank for your products will show up here
          once you launch something.
        </p>

        {!user.emailVerified && (
          <div className="mt-6 rounded-lg border border-hairline px-4 py-3">
            <p className="text-sm">
              Confirm your email to vote and comment — check your inbox for
              the link we sent.
            </p>
            <ResendVerificationButton />
          </div>
        )}

        <div className="mt-10 flex items-center gap-4 rounded-lg border border-hairline p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold-fill font-display text-lg text-background">
            {user.firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
