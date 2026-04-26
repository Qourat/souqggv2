"use client";

import { useEffect } from "react";

import { useCartStore } from "@/modules/cart/cart.store";

/**
 * Renders nothing — clears the cart store on mount. Used on the thank-you
 * page after a successful redirect, so the user starts fresh next time.
 */
export function ClearCartOnMount() {
  const clear = useCartStore((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
