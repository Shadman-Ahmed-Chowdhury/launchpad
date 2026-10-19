"use client";

import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/products";
import type { AuthFormState } from "@/lib/action-state";
import type { Topic } from "@/types";

const MAX_TOPICS = 3;

interface ProductFormValues {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  topicIds: number[];
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
    <form action={formAction} className="mt-10 space-y-6">
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
  );
}
