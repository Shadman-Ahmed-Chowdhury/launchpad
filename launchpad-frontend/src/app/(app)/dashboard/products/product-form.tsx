"use client";

import { useActionState, useRef, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/products";
import { ImageLightbox } from "@/components/image-lightbox";
import { XIcon } from "@/components/icons";
import { ScreenshotManager } from "@/components/screenshot-manager";
import type { AuthFormState } from "@/lib/action-state";
import type { ProductScreenshot, Topic } from "@/types";

const MAX_TOPICS = 3;
const MAX_SCREENSHOTS = 3;

interface ProductFormValues {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  topicIds: number[];
  screenshots?: ProductScreenshot[];
}

/**
 * Shared by the add-product page (no `slug`/`defaultValues`, posts to
 * `createProductAction`) and the edit-draft page (both set, posts to
 * `updateProductAction` bound to that slug).
 */
export function ProductForm({
  topics,
  slug,
  defaultValues,
}: {
  topics: Topic[];
  slug?: string;
  defaultValues?: ProductFormValues;
}) {
  const action = slug ? updateProductAction.bind(null, slug) : createProductAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>(
    defaultValues?.topicIds ?? [],
  );

  function toggleTopic(id: number) {
    setSelectedTopicIds((current) =>
      current.includes(id)
        ? current.filter((topicId) => topicId !== id)
        : current.length < MAX_TOPICS
          ? [...current, id]
          : current,
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <form action={formAction} className="space-y-6">
        {state?.message && <p className="text-sm text-danger">{state.message}</p>}

        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            placeholder="FlowCraft"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.name && (
            <p className="mt-2 text-sm text-danger">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="tagline" className="text-sm font-medium">
            One-line pitch
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            required
            defaultValue={defaultValues?.tagline}
            placeholder="Visual workflows for small teams"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.tagline && (
            <p className="mt-2 text-sm text-danger">{state.errors.tagline[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            defaultValue={defaultValues?.description}
            placeholder="What does it do, and who's it for?"
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
            defaultValue={defaultValues?.websiteUrl}
            placeholder="https://example.com"
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.website_url && (
            <p className="mt-2 text-sm text-danger">{state.errors.website_url[0]}</p>
          )}
        </div>

        <div>
          <span className="text-sm font-medium">
            Topics <span className="text-muted">(up to {MAX_TOPICS})</span>
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic) => {
              const selected = selectedTopicIds.includes(topic.id);
              const disabled = !selected && selectedTopicIds.length >= MAX_TOPICS;

              return (
                <label
                  key={topic.id}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                    selected
                      ? "border-gold bg-gold-fill text-background"
                      : "border-hairline text-muted hover:text-foreground"
                  } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="topic_ids"
                    value={topic.id}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => toggleTopic(topic.id)}
                    className="sr-only"
                  />
                  {topic.name}
                </label>
              );
            })}
          </div>
          {state?.errors?.topic_ids && (
            <p className="mt-2 text-sm text-danger">{state.errors.topic_ids[0]}</p>
          )}
        </div>

        {!slug && (
          // Creating a new product: nothing exists to attach screenshots to
          // yet, so they're staged locally and submitted together with the
          // rest of the form.
          <StagedScreenshotsPicker error={state?.errors?.screenshots?.[0]} />
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90 disabled:opacity-60 sm:w-auto"
        >
          {pending
            ? slug
              ? "Saving…"
              : "Submitting…"
            : slug
              ? "Save changes"
              : "Submit as draft"}
        </button>
      </form>

      {slug && (
        // Editing an existing product: screenshots are managed live, one at
        // a time, independent of this form's own save (see ADR-036) —
        // ScreenshotManager calls the API directly on add/remove. Rendered
        // as a sibling of <form>, not inside it — its own per-thumbnail
        // <form>s can't legally nest inside another <form>.
        <ScreenshotManager slug={slug} screenshots={defaultValues?.screenshots ?? []} />
      )}
    </div>
  );
}

/**
 * Local-only screenshot staging for the create-product form — there's no
 * product id yet to attach screenshots to individually, so these are kept
 * as plain `File`s in state and synced onto the real file input (via a
 * `DataTransfer`, since `<input>.files` isn't directly settable) so the
 * form submits them with everything else. Still gets the same
 * view/remove-before-save UX as the live manager used once editing.
 */
function StagedScreenshotsPicker({ error }: { error?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [openFile, setOpenFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function syncInputFiles(next: File[]) {
    const transfer = new DataTransfer();
    next.forEach((file) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    const next = [...files, ...picked].slice(0, MAX_SCREENSHOTS);
    setFiles(next);
    syncInputFiles(next);
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInputFiles(next);
  }

  return (
    <div>
      <span className="text-sm font-medium">
        Screenshots <span className="text-muted">(up to {MAX_SCREENSHOTS})</span>
      </span>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {files.map((file, index) => (
            <StagedScreenshotThumbnail
              key={`${index}-${file.name}`}
              file={file}
              onView={() => setOpenFile(file)}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      )}

      {files.length < MAX_SCREENSHOTS && (
        <div className="mt-3">
          <label
            htmlFor="screenshots"
            className="inline-block cursor-pointer rounded-full border border-hairline px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            Choose files
          </label>
          <input
            ref={inputRef}
            id="screenshots"
            name="screenshots"
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {openFile && (
        <ImageLightbox
          src={URL.createObjectURL(openFile)}
          alt={openFile.name}
          onClose={() => setOpenFile(null)}
        />
      )}
    </div>
  );
}

function StagedScreenshotThumbnail({
  file,
  onView,
  onRemove,
}: {
  file: File;
  onView: () => void;
  onRemove: () => void;
}) {
  const url = URL.createObjectURL(file);

  return (
    <div className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-hairline">
      <button type="button" onClick={onView} className="block h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an uploaded asset */}
        <img src={url} alt={file.name} className="h-full w-full object-cover" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-danger"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
