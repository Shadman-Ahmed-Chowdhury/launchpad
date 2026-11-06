"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

/**
 * Uses the Web Share API where available (mobile browsers, mostly); falls
 * back to copying the product's URL to the clipboard everywhere else, with
 * a brief "Copied" confirmation instead of a silent no-op.
 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the share sheet — not an error worth surfacing.
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
    >
      <ShareIcon className="h-4 w-4" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
