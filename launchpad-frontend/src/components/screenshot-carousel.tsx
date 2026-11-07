"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/icons";
import { ImageLightbox } from "@/components/image-lightbox";
import type { ProductScreenshot } from "@/types";

/**
 * Shows a product's screenshots one at a time with prev/next controls, on
 * the product detail page. Falls back to the old placeholder box when a
 * product has none (see docs/02-features.md — screenshots are optional).
 * Clicking the current image opens it full-size (see ImageLightbox).
 */
export function ScreenshotCarousel({ screenshots }: { screenshots: ProductScreenshot[] }) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (screenshots.length === 0) {
    return (
      <div className="mt-8 flex aspect-video w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-gradient-to-br from-gold-fill/10 to-foreground/5 text-muted">
        <ImageIcon className="h-6 w-6" />
        <span className="text-sm">Product screenshot</span>
      </div>
    );
  }

  function previous() {
    setIndex((current) => (current === 0 ? screenshots.length - 1 : current - 1));
  }

  function next() {
    setIndex((current) => (current === screenshots.length - 1 ? 0 : current + 1));
  }

  const current = screenshots[index];
  const caption = `Screenshot ${index + 1} of ${screenshots.length}`;

  return (
    <div className="mt-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-hairline bg-foreground/5">
        {/* eslint-disable-next-line @next/next/no-img-element -- no next/image remote-domain config in this project yet (uploads can live on S3 or the local disk) */}
        <img
          src={current.url}
          alt={caption}
          onClick={() => setLightboxOpen(true)}
          className="h-full w-full cursor-zoom-in object-contain"
        />

        {screenshots.length > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Previous screenshot"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next screenshot"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              ›
            </button>
          </>
        )}
      </div>

      {screenshots.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {screenshots.map((screenshot, screenshotIndex) => (
            <button
              key={screenshot.id}
              type="button"
              onClick={() => setIndex(screenshotIndex)}
              aria-label={`Go to screenshot ${screenshotIndex + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                screenshotIndex === index ? "bg-gold" : "bg-hairline"
              }`}
            />
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox src={current.url} alt={caption} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
