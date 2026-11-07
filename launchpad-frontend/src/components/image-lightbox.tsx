"use client";

import { useEffect } from "react";
import { XIcon } from "@/components/icons";

/**
 * Full-size view of a single image — opened by clicking a screenshot
 * thumbnail (product page carousel, review queue, or the screenshot
 * manager on the edit form). Closes on Escape, backdrop click, or the X.
 */
export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background transition-colors hover:bg-background/30"
      >
        <XIcon className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- no next/image remote-domain config in this project yet */}
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </div>
  );
}
