"use client";

import { CheckIcon, XIcon } from "@/components/icons";
import { useToastList } from "@/components/toast-provider";

/**
 * Fixed-position stack, bottom-center on mobile / bottom-right on larger
 * screens. Mounted once in the root layout — nothing else needs to render
 * this directly, push a toast via `useToast()` instead.
 */
export function Toaster() {
  const { toasts, dismiss } = useToastList();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-hairline bg-background px-4 py-3 shadow-lg"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-background ${
              toast.type === "success" ? "bg-success" : "bg-danger"
            }`}
          >
            {toast.type === "success" ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              <XIcon className="h-3 w-3" />
            )}
          </span>
          <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 text-muted transition-colors hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
