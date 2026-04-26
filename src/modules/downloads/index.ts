/**
 * Downloads module — Sprint 4 (Library & Delivery).
 *
 * Layout mirrors orders/ and products/:
 *   downloads.controller.ts  — server-side glue used by pages
 *   downloads.service.ts     — fulfil orders, mint signed URLs, list library
 *   downloads.repository.ts  — Supabase queries (admin client for writes,
 *                              user-scoped client for the library)
 *   downloads.resource.ts    — locale-aware LibraryItemDto for the UI
 */

export { downloadsController } from "./downloads.controller";
export {
  downloadsService,
  FILES_BUCKET,
  DOWNLOAD_TTL_SECONDS,
} from "./downloads.service";
export type { LibraryItemDto } from "./downloads.resource";
