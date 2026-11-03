import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ResendVerificationButton } from "./resend-verification-button";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">
        Welcome, {user.firstName}
      </h1>
      <p className="mt-2 text-muted">
        Views, votes over the day, traffic sources, and rank will show up
        here once that tracking exists.
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

      <div className="mt-10 flex items-center justify-between rounded-lg border border-hairline p-5">
        <div>
          <p className="font-medium">Your products</p>
          <p className="mt-0.5 text-sm text-muted">
            See what you&apos;ve submitted, edit drafts, and pick launch days.
          </p>
        </div>
        <Link
          href="/dashboard/products"
          className="shrink-0 rounded-full bg-gold-fill px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
        >
          View products
        </Link>
      </div>
    </div>
  );
}
