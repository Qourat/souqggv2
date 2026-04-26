"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProductDto } from "@/modules/products";

/**
 * Cart store — Zustand + localStorage persistence.
 *
 * Psychology applied:
 *   - Endowment effect: items persist across sessions so the user feels
 *     they already "own" them and is more likely to complete purchase.
 *   - Sunk-cost / anchoring: subtotal + compare-at total are exposed so
 *     the UI can show savings on every render.
 *   - Loss aversion: explicit `clear()` requires a confirmation in the UI,
 *     never accidentally fires.
 */

export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  unitPriceCents: number;
  compareAtCents: number | null;
  currency: string;
  quantity: number;
}

export interface CartCoupon {
  code: string;
  discountCents: number;
  totalCents: number;
  discountLabel: string;
  appliedAt: string;
}

interface CartState {
  lines: CartLine[];
  coupon: CartCoupon | null;
  add: (product: ProductDto) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  setCoupon: (coupon: CartCoupon | null) => void;
  clear: () => void;
}

interface CartSelectors {
  itemCount: number;
  subtotalCents: number;
  compareAtTotalCents: number;
  savingsCents: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      coupon: null,

      add: (p) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === p.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l,
              ),
              coupon: null,
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                productId: p.id,
                slug: p.slug,
                title: p.title,
                thumbnailUrl: p.thumbnailUrl,
                unitPriceCents: p.priceCents,
                compareAtCents: p.compareAtCents,
                currency: p.currency,
                quantity: 1,
              },
            ],
            coupon: null,
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l,
            )
            .filter((l) => l.quantity > 0),
          coupon: null,
        })),

      remove: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
          coupon: null,
        })),

      setCoupon: (coupon) => set({ coupon }),

      clear: () => set({ lines: [], coupon: null }),
    }),
    { name: "souq.cart.v2" },
  ),
);

export function selectCart(state: CartState): CartSelectors {
  const subtotalCents = state.lines.reduce(
    (s, l) => s + l.unitPriceCents * l.quantity,
    0,
  );
  const compareAtTotalCents = state.lines.reduce(
    (s, l) => s + (l.compareAtCents ?? l.unitPriceCents) * l.quantity,
    0,
  );
  return {
    itemCount: state.lines.reduce((s, l) => s + l.quantity, 0),
    subtotalCents,
    compareAtTotalCents,
    savingsCents: Math.max(0, compareAtTotalCents - subtotalCents),
  };
}
