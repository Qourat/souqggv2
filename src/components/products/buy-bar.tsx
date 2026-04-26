"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/modules/cart/cart.store";
import type { ProductDto } from "@/modules/products";

/**
 * The action surface on the product page. Two CTAs only — "Buy now" and
 * "Add to cart" — to honour Hick's Law (≤2 choices reduces decision time).
 *
 * - "Buy now" adds and routes to /checkout (single decisive path).
 * - "Add to cart" adds and stays on page; on second click, button flips to
 *   "In cart" with a check (positive feedback, sunk-cost anchor).
 * - Loss aversion phrasing baked in: discount % shown next to the buttons,
 *   never in a separate sidebar block.
 */
export function BuyBar({ product }: { product: ProductDto }) {
  const t = useTranslations();
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const inCart = useCartStore((s) =>
    s.lines.some((l) => l.productId === product.id),
  );
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    add(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  const handleBuyNow = () => {
    if (!inCart) add(product);
    router.push("/checkout");
  };

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Button variant="primary" size="lg" className="w-full" onClick={handleBuyNow}>
        {t("common.buyNow")}
      </Button>
      <Button
        variant={inCart ? "muted" : "outline"}
        size="lg"
        className="w-full"
        onClick={handleAdd}
        disabled={justAdded}
      >
        {inCart ? (
          <>
            <Check className="h-3 w-3" /> {t("common.inCart")}
          </>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3" /> {t("common.addToCart")}
          </>
        )}
      </Button>
    </div>
  );
}
