"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/shared/utils";

/**
 * Compact product gallery.
 *
 * - Always renders a square hero, falling back to a deterministic glyph
 *   placeholder when the product has no images. The placeholder uses a
 *   2-letter monogram so visually-empty cards still feel like "stuff".
 * - Thumbnails sit below; clicking them swaps the hero. Keyboard accessible
 *   via real <button>s.
 * - Borders are hairline + sharp corners to keep the retro/terminal feel.
 */
export function ProductGallery({
  thumbnailUrl,
  galleryUrls,
  title,
  type,
}: {
  thumbnailUrl: string | null;
  galleryUrls: string[];
  title: string;
  type: string;
}) {
  const allImages = [
    ...(thumbnailUrl ? [thumbnailUrl] : []),
    ...galleryUrls,
  ].filter(Boolean) as string[];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = allImages[activeIndex] ?? null;

  return (
    <div className="space-y-2.5">
      <div className="aspect-[4/3] border-hairline rounded-sm bg-surface relative overflow-hidden">
        {active ? (
          <Image
            src={active}
            alt={title}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-opacity duration-300"
            priority
          />
        ) : (
          <Placeholder title={title} type={type} />
        )}
      </div>

      {allImages.length > 1 ? (
        <div className="grid grid-cols-6 gap-1.5">
          {allImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveIndex(i);
                }
              }}
              className={cn(
                "aspect-square border-hairline rounded-sm relative overflow-hidden bg-surface transition-all duration-150",
                i === activeIndex
                  ? "ring-1 ring-terracotta border-terracotta opacity-100"
                  : "opacity-70 hover:opacity-100 row-hover",
              )}
              aria-label={`Image ${i + 1} of ${allImages.length}`}
              aria-pressed={i === activeIndex}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Placeholder({ title, type }: { title: string; type: string }) {
  const monogram = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "S";

  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,hsl(var(--terracotta)/0.18),transparent_55%),radial-gradient(circle_at_75%_75%,hsl(var(--gold)/0.12),transparent_60%)]" />
      <div className="absolute inset-0 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      <div className="relative text-center">
        <div className="font-mono text-3xl tracking-tight">{monogram}</div>
        <div className="label-mono mt-1">{type}</div>
      </div>
    </div>
  );
}
