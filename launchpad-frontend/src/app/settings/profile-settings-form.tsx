"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { AuthFormState } from "@/lib/action-state";
import type { User, UserLink } from "@/types";

export function ProfileSettingsForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateProfileAction,
    undefined,
  );
  const [links, setLinks] = useState<Omit<UserLink, "id">[]>(
    user.links.map(({ label, url }) => ({ label, url })),
  );

  function updateLink(index: number, field: "label" | "url", value: string) {
    setLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="mt-10 space-y-6">
      {state?.message && (
        <p className={`text-sm ${state.message === "saved" ? "text-muted" : "text-danger"}`}>
          {state.message === "saved" ? "Profile saved." : state.message}
        </p>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="firstName" className="text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            defaultValue={user.firstName}
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.first_name && (
            <p className="mt-2 text-sm text-danger">{state.errors.first_name[0]}</p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            defaultValue={user.lastName}
            className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
          />
          {state?.errors?.last_name && (
            <p className="mt-2 text-sm text-danger">{state.errors.last_name[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="handle" className="text-sm font-medium">
          Handle
        </label>
        <input
          id="handle"
          name="handle"
          type="text"
          required
          defaultValue={user.handle}
          className="mt-2 w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        <p className="mt-2 text-xs text-muted">
          Your public profile is at /profile/{user.handle}
        </p>
        {state?.errors?.handle && (
          <p className="mt-2 text-sm text-danger">{state.errors.handle[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={2}
          maxLength={255}
          defaultValue={user.bio ?? ""}
          placeholder="One line about you"
          className="mt-2 w-full resize-none border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
        />
        {state?.errors?.bio && (
          <p className="mt-2 text-sm text-danger">{state.errors.bio[0]}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Links</span>
          {links.length < 10 && (
            <button
              type="button"
              onClick={() => setLinks((current) => [...current, { label: "", url: "" }])}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Add link
            </button>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(event) => updateLink(index, "label", event.target.value)}
                placeholder="Label"
                className="w-28 shrink-0 border-b border-hairline bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold"
              />
              <input
                type="url"
                value={link.url}
                onChange={(event) => updateLink(index, "url", event.target.value)}
                placeholder="https://"
                className="flex-1 border-b border-hairline bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold"
              />
              <button
                type="button"
                onClick={() => removeLink(index)}
                aria-label="Remove link"
                className="shrink-0 text-muted transition-colors hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input type="hidden" name="links" value={JSON.stringify(links)} />
        {state?.errors?.links && (
          <p className="mt-2 text-sm text-danger">{state.errors.links[0]}</p>
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
