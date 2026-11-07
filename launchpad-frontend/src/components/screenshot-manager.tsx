"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addScreenshotAction, removeScreenshotAction } from "@/app/actions/products";
import { ImageLightbox } from "@/components/image-lightbox";
import { XIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";
import type { AuthFormState } from "@/lib/action-state";
import type { ProductScreenshot } from "@/types";

const MAX_SCREENSHOTS = 3;

/**
 * Live screenshot management for an existing product's edit page — each
 * add/remove takes effect immediately against the API (see ADR-036), not
 * bundled into the rest of the form's "Save changes". `screenshots` always
 * reflects the server (the actions revalidate the edit page's path), so
 * this component holds no local copy of the list itself.
 */
export function ScreenshotManager({
  slug,
  screenshots,
}: {
  slug: string;
  screenshots: ProductScreenshot[];
}) {
  const [openScreenshot, setOpenScreenshot] = useState<ProductScreenshot | null>(null);

  return (
    <div>
      <span className="text-sm font-medium">
        Screenshots <span className="text-muted">(up to {MAX_SCREENSHOTS})</span>
      </span>

      {screenshots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {screenshots.map((screenshot) => (
            <ScreenshotThumbnail
              key={screenshot.id}
              slug={slug}
              screenshot={screenshot}
              onView={() => setOpenScreenshot(screenshot)}
            />
          ))}
        </div>
      )}

      {screenshots.length < MAX_SCREENSHOTS && (
        <AddScreenshotButton slug={slug} remaining={MAX_SCREENSHOTS - screenshots.length} />
      )}

      {openScreenshot && (
        <ImageLightbox
          src={openScreenshot.url}
          alt="Product screenshot"
          onClose={() => setOpenScreenshot(null)}
        />
      )}
    </div>
  );
}

function ScreenshotThumbnail({
  slug,
  screenshot,
  onView,
}: {
  slug: string;
  screenshot: ProductScreenshot;
  onView: () => void;
}) {
  const action = removeScreenshotAction.bind(null, slug, screenshot.id);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);
  const toast = useToast();

  useEffect(() => {
    if (state?.message && !state.success) toast.error(state.message);
  }, [state, toast]);

  return (
    <div className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-hairline">
      <button type="button" onClick={onView} className="block h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- no next/image remote-domain config in this project yet */}
        <img src={screenshot.url} alt="Product screenshot" className="h-full w-full object-cover" />
      </button>
      <form action={formAction} className="absolute right-1 top-1">
        <button
          type="submit"
          disabled={pending}
          aria-label="Remove screenshot"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-danger disabled:opacity-50"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

function AddScreenshotButton({ slug, remaining }: { slug: string; remaining: number }) {
  const action = addScreenshotAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state?.message && !state.success) toast.error(state.message);
  }, [state, toast]);

  return (
    <div className="mt-3">
      <form ref={formRef} action={formAction}>
        <label
          htmlFor="add-screenshot"
          className={`inline-block rounded-full border border-hairline px-4 py-2 text-sm font-medium text-foreground transition-colors ${
            pending ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-gold hover:text-gold"
          }`}
        >
          {pending ? "Uploading…" : "Add screenshot"}
        </label>
        <input
          id="add-screenshot"
          name="screenshots"
          type="file"
          accept="image/*"
          multiple={remaining > 1}
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
          className="hidden"
        />
      </form>
    </div>
  );
}
