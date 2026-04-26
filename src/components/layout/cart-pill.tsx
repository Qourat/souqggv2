"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { Link } from "@/shared/i18n/navigation";
import { selectCart, useCartStore } from "@/modules/cart/cart.store";

/**
 * Live cart counter. Hydration-safe: shows 0 server-side and only swaps
 * to the persisted count after the store has mounted client-side. The
 * pill never reflows because the digit slot is always present.
 */
export function CartPill({ ariaLabel }: { ariaLabel: string }) {
  const itemCount = useCartStore((s) => selectCart(s).itemCount);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const display = mounted ? itemCount : 0;

  return (
    <Link
      href="/cart"
      aria-label={ariaLabel}
      className="h-7 inline-flex items-center gap-1.5 px-2 text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-sm border-hairline tnum"
    >
      <ShoppingBag className="h-3.5 w-3.5" />
      <span className="label-mono">{display}</span>
    </Link>
  );
}
