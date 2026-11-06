"use client";

import { useActionState } from "react";
import { updateProductAction } from "@/app/actions/products";
import type { AuthFormState } from "@/lib/action-state";

/**
 * Once a product has launched, only description and website may change
 * (see docs/02-features.md) — a trimmed-down sibling of `ProductForm`,
 * which also edits name/tagline/topics that the backend silently ignores
 * past launch (`ProductController::update()`).
 */
export function LaunchedProductForm({
  slug,
  defaultValues,
}: {
  slug: string;
  defaultValues: { description: string; websiteUrl: string };
}) {
  const action = updateProductAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="mt-10 space-y-6">
      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <div>
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          defaultValue={defaultValues.description}
          className="mt-2 w-full resize-none border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        {state?.errors?.description && (
          <p className="mt-2 text-sm text-danger">{state.errors.description[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="websiteUrl" className="text-sm font-medium">
          Website
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          required
          defaultValue={defaultValues.websiteUrl}
          placeholder="https://example.com"
          className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        {state?.errors?.website_url && (
          <p className="mt-2 text-sm text-danger">{state.errors.website_url[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
