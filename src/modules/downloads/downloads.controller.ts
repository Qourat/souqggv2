import "server-only";

import { getLocale } from "next-intl/server";

import { downloadsService } from "./downloads.service";
import type { LibraryItemDto } from "./downloads.resource";

export const downloadsController = {
  async listForUser(userId: string): Promise<LibraryItemDto[]> {
    const locale = await getLocale();
    const r = await downloadsService.listForUser(userId, locale);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async listForOrder(orderId: string): Promise<LibraryItemDto[]> {
    const locale = await getLocale();
    const r = await downloadsService.listForOrder(orderId, locale);
    if (!r.ok) throw r.error;
    return r.value;
  },
};
