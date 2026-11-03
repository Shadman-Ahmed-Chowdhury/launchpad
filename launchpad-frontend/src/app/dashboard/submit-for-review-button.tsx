"use client";

import { useActionState } from "react";
import { submitProductAction } from "@/app/actions/products";
import type { AuthFormState } from "@/lib/action-state";

export function SubmitForReviewButton({ slug }: { slug: string }) {
  const action = submitProductAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="shrink-0">
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-gold disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
      {state?.message && <p className="mt-1 text-xs text-danger">{state.message}</p>}
    </form>
  );
}
