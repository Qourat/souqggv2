"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/utils";

/**
 * Compact, retro-styled tab strip.
 *
 * Psychology applied:
 *   - Miller 7±2: capped at 5 tabs.
 *   - Serial position: Overview is first (primacy), FAQ is last (recency).
 *   - Default effect: "Overview" is pre-selected so the page reads top-down
 *     even if no tab is touched.
 *   - Information scent: empty tabs are hidden so users never click into
 *     dead ends.
 */

export interface ProductTab {
  key: "overview" | "included" | "audience" | "howto" | "faq";
  content: ReactNode;
}

export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const t = useTranslations("product");
  const visible = tabs.filter((tab) => tab.content);
  const [active, setActive] = useState<ProductTab["key"]>(
    visible[0]?.key ?? "overview",
  );

  if (visible.length === 0) return null;

  return (
    <div className="border-hairline rounded-sm bg-surface">
      <div role="tablist" className="flex border-b border-border overflow-x-auto">
        {visible.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "h-9 px-3 label-mono whitespace-nowrap border-r border-border last:border-r-0",
              active === tab.key
                ? "bg-surface-raised text-foreground"
                : "row-hover text-muted-foreground",
            )}
            type="button"
          >
            {t(`tabs.${tab.key}`)}
          </button>
        ))}
      </div>
      <div className="p-3.5 text-sm leading-relaxed">
        {visible.find((tab) => tab.key === active)?.content}
      </div>
    </div>
  );
}
