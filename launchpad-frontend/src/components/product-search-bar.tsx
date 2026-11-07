"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Topic } from "@/types";

const SORTS: { value: "votes" | "newest"; label: string }[] = [
  { value: "votes", label: "Most voted" },
  { value: "newest", label: "Newest" },
];

const CHIP_BASE = "rounded-full border px-4 py-2 text-sm transition-colors";
const CHIP_SELECTED = "border-gold bg-gold-fill text-background";
const CHIP_UNSELECTED = "border-hairline text-muted hover:text-foreground";
const DATE_INPUT =
  "border-b border-hairline bg-transparent py-1.5 text-sm outline-none transition-colors focus:border-gold";

/**
 * Search, multi-select topic filter, launch-date range, and sort for the
 * product list page (see ADR-039/ADR-040). All of it lives in the URL's
 * search params — `getProducts()` reads them server-side, so this component
 * only ever updates the URL (via `router.replace`, wrapped in a transition
 * so the current results stay on screen instead of flashing a loading state
 * while the server re-fetches).
 */
export function ProductSearchBar({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  const selectedTopics = (searchParams.get("topics") ?? "")
    .split(",")
    .filter(Boolean);
  const activeSort = searchParams.get("sort") === "newest" ? "newest" : "votes";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";

  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const [topicQuery, setTopicQuery] = useState("");
  const topicMenuRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync with the URL on back/forward navigation — a
  // render-phase adjustment (React's recommended pattern for "state that
  // depends on a prop"), not an effect, since it only ever needs to run
  // when urlQuery itself changes.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  // Close the topic dropdown on an outside click.
  useEffect(() => {
    if (!isTopicMenuOpen) return;

    function handleClick(event: MouseEvent) {
      if (
        topicMenuRef.current &&
        !topicMenuRef.current.contains(event.target as Node)
      ) {
        setIsTopicMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isTopicMenuOpen]);

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");

    startTransition(() => {
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    });
  }

  function toggleTopic(slug: string) {
    const next = selectedTopics.includes(slug)
      ? selectedTopics.filter((selected) => selected !== slug)
      : [...selectedTopics, slug];

    navigate({ topics: next.length ? next.join(",") : null });
  }

  // Debounce typing before it reaches the URL (and the server) — this is
  // what keeps search "feeling instant" instead of refetching every
  // keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === (searchParams.get("q") ?? "")) return;

    const timeout = setTimeout(() => navigate({ q: trimmed || null }), 300);
    return () => clearTimeout(timeout);
    // Only the debounced search term should re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const visibleTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(topicQuery.trim().toLowerCase()),
  );
  const selectedTopicNames = topics.filter((topic) =>
    selectedTopics.includes(topic.slug),
  );

  return (
    <div
      className={`mt-8 space-y-4 transition-opacity ${isPending ? "opacity-60" : ""}`}
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, or what it does…"
        aria-label="Search products"
        className="w-full border-b border-hairline bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-gold"
      />

      <div className="flex flex-wrap items-center gap-4">
        <div ref={topicMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsTopicMenuOpen((open) => !open)}
            aria-expanded={isTopicMenuOpen}
            className={`${CHIP_BASE} ${selectedTopics.length ? CHIP_SELECTED : CHIP_UNSELECTED}`}
          >
            {selectedTopics.length ? `Topics · ${selectedTopics.length}` : "All topics"}
          </button>

          {isTopicMenuOpen && (
            <div className="absolute z-10 mt-2 w-64 rounded-lg border border-hairline bg-background p-3 shadow-lg">
              <input
                type="text"
                autoFocus
                value={topicQuery}
                onChange={(event) => setTopicQuery(event.target.value)}
                placeholder="Search topics…"
                aria-label="Search topics"
                className="w-full border-b border-hairline bg-transparent pb-2 text-sm outline-none placeholder:text-muted focus:border-gold"
              />

              <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                {visibleTopics.length === 0 && (
                  <p className="py-2 text-sm text-muted">No topics match.</p>
                )}
                {visibleTopics.map((topic) => (
                  <label
                    key={topic.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-hairline/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.slug)}
                      onChange={() => toggleTopic(topic.slug)}
                      className="accent-gold"
                    />
                    {topic.name}
                  </label>
                ))}
              </div>

              {selectedTopics.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ topics: null })}
                  className="mt-2 text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear topics
                </button>
              )}
            </div>
          )}
        </div>

        {selectedTopicNames.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => toggleTopic(topic.slug)}
            className={`${CHIP_BASE} ${CHIP_SELECTED}`}
          >
            {topic.name} ×
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted">
          From
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => navigate({ from: event.target.value || null })}
            aria-label="Launched from"
            className={DATE_INPUT}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          To
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => navigate({ to: event.target.value || null })}
            aria-label="Launched to"
            className={DATE_INPUT}
          />
        </label>
        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={() => navigate({ from: null, to: null })}
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear dates
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {SORTS.map((sort) => (
          <button
            key={sort.value}
            type="button"
            onClick={() =>
              navigate({ sort: sort.value === "votes" ? null : sort.value })
            }
            className={`${CHIP_BASE} ${activeSort === sort.value ? CHIP_SELECTED : CHIP_UNSELECTED}`}
          >
            {sort.label}
          </button>
        ))}
      </div>
    </div>
  );
}
