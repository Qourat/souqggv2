import type { SessionUser } from "@/shared/auth/session";

import type { Product } from "./products.types";

/**
 * Authorization rules — Laravel's Policy. Pure, side-effect free. Centralised
 * so we can grep "products.policy" to audit every access decision.
 */
export const productsPolicy = {
  canView(product: Product, user: SessionUser | null): boolean {
    if (product.status === "published") return true;
    return user?.role === "admin";
  },

  canCreate(user: SessionUser | null): boolean {
    return user?.role === "admin";
  },

  canUpdate(_product: Product, user: SessionUser | null): boolean {
    return user?.role === "admin";
  },

  canDelete(_product: Product, user: SessionUser | null): boolean {
    return user?.role === "admin";
  },
};
