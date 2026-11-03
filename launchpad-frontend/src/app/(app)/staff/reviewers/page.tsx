import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getReviewers } from "@/lib/reviewers";
import { ReviewerActions } from "./reviewer-actions";

export default async function ReviewersPage() {
  await requireAdmin("/staff/reviewers");
  const reviewers = await getReviewers();

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">Reviewers</h1>
        <Link
          href="/staff/reviewers/new"
          className="shrink-0 rounded-full bg-gold-fill px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
        >
          Add reviewer
        </Link>
      </div>
      <p className="mt-2 text-muted">
        Staff who can approve, reject, or send back submissions.
      </p>

      {reviewers.length === 0 ? (
        <p className="mt-6 text-muted">No reviewer accounts yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-hairline">
          {reviewers.map((reviewer) => (
            <div key={reviewer.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-fill text-xs font-medium text-background">
                  {reviewer.firstName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {reviewer.firstName} {reviewer.lastName}
                  </p>
                  <p className="truncate text-sm text-muted">{reviewer.email}</p>
                </div>
              </div>
              <ReviewerActions reviewer={reviewer} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
