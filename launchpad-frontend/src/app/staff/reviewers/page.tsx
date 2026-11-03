import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireAdmin } from "@/lib/auth";
import { getReviewers } from "@/lib/reviewers";
import { CreateReviewerForm } from "./create-reviewer-form";

export default async function ReviewersPage() {
  await requireAdmin("/staff/reviewers");
  const reviewers = await getReviewers();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <Link
          href="/staff"
          className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
        >
          Back to review queue
        </Link>

        <h1 className="mt-4 font-display text-3xl tracking-tight">Reviewers</h1>
        <p className="mt-2 text-muted">
          Staff who can approve, reject, or send back submissions.
        </p>

        {reviewers.length === 0 ? (
          <p className="mt-6 text-muted">No reviewer accounts yet.</p>
        ) : (
          <div className="mt-6 divide-y divide-hairline">
            {reviewers.map((reviewer) => (
              <div key={reviewer.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-fill text-xs font-medium text-background">
                  {reviewer.firstName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">
                    {reviewer.firstName} {reviewer.lastName}
                  </p>
                  <p className="truncate text-sm text-muted">{reviewer.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-12 font-display text-xl">Create a reviewer</h2>
        <CreateReviewerForm />
      </main>

      <SiteFooter />
    </div>
  );
}
