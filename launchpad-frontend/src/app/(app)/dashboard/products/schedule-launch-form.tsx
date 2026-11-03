"use client";

import { useActionState } from "react";
import { scheduleLaunchAction } from "@/app/actions/products";
import type { AuthFormState } from "@/lib/action-state";

/**
 * Lets a founder pick (or change) their approved product's launch day (see
 * ADR-027 — the per-day slot cap is enforced on the backend).
 */
export function ScheduleLaunchForm({
  slug,
  launchDate,
}: {
  slug: string;
  launchDate: string | null;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    scheduleLaunchAction.bind(null, slug),
    undefined,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-center gap-3">
      <input
        type="date"
        name="launchDate"
        defaultValue={launchDate ?? undefined}
        required
        min={new Date().toISOString().slice(0, 10)}
        className="rounded-lg border border-hairline bg-transparent px-3 py-1.5 text-sm outline-none focus:border-gold"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold-fill px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : launchDate ? "Change launch day" : "Pick launch day"}
      </button>
      {state?.errors?.launch_date && (
        <p className="w-full text-sm text-danger">{state.errors.launch_date[0]}</p>
      )}
      {state?.message && <p className="w-full text-sm text-danger">{state.message}</p>}
    </form>
  );
}
