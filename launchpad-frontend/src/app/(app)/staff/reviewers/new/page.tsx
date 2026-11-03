import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { CreateReviewerForm } from "../create-reviewer-form";

export default async function NewReviewerPage() {
  await requireAdmin("/staff/reviewers/new");

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <Link
        href="/staff/reviewers"
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        Back to reviewers
      </Link>

      <h1 className="mt-4 font-display text-3xl tracking-tight">
        Add a reviewer
      </h1>
      <p className="mt-2 text-muted">
        There&apos;s no public signup for this role — you&apos;re creating the
        login directly.
      </p>

      <CreateReviewerForm />
    </div>
  );
}
