/**
 * Drizzle schema — TypeScript source of truth for the database.
 *
 * Localized fields are stored as JSONB (`{ en: "...", ar: "..." }`) so
 * adding a new language never requires a schema migration. See
 * `src/shared/i18n/localized-field.ts` for the read/write helpers.
 *
 * The canonical SQL (with triggers, RLS, FTS, seed) lives in /db/*.sql and
 * must stay in sync with this file.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { LocalizedField } from "@/shared/i18n/localized-field";

// ----- custom types -----------------------------------------------------------
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

// ----- enums ------------------------------------------------------------------
export const userRole = pgEnum("user_role", ["buyer", "admin"]);

export const productType = pgEnum("product_type", [
  "pdf",
  "excel",
  "word",
  "notion",
  "prompt_pack",
  "template",
  "course",
  "code",
  "dataset",
  "bundle",
  "mixed",
]);

export const productStatus = pgEnum("product_status", [
  "draft",
  "review",
  "published",
  "archived",
]);

export const licenseType = pgEnum("license_type", [
  "personal_use",
  "business_use",
  "commercial_use",
  "resale_rights",
]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "fulfilled",
  "refunded",
  "failed",
  "cancelled",
]);

export const paymentProvider = pgEnum("payment_provider", [
  "stripe",
  "paytabs",
  "telr",
  "checkout",
  "manual",
]);

export const couponDiscountType = pgEnum("coupon_discount_type", [
  "percent",
  "amount",
]);

export const reviewStatus = pgEnum("review_status", [
  "pending",
  "approved",
  "hidden",
]);

export const aiJobStatus = pgEnum("ai_job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
]);

// ----- tables -----------------------------------------------------------------
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  preferredLocale: text("preferred_locale").default("en").notNull(),
  role: userRole("role").default("buyer").notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => ({
  emailIdx: uniqueIndex("profiles_email_idx").on(t.email),
}));

export const categories = pgTable(
  "categories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull(),
    name: jsonb("name").$type<LocalizedField>().notNull().default({}),
    description: jsonb("description").$type<LocalizedField>().default({}),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0).notNull(),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
    parentIdx: index("categories_parent_idx").on(t.parentId),
  }),
);

export const products = pgTable(
  "products",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    type: productType("type").notNull(),
    status: productStatus("status").default("draft").notNull(),
    title: jsonb("title").$type<LocalizedField>().notNull().default({}),
    descriptionShort: jsonb("description_short")
      .$type<LocalizedField>()
      .default({}),
    descriptionLong: jsonb("description_long")
      .$type<LocalizedField>()
      .default({}),
    bullets: jsonb("bullets").$type<LocalizedField[]>().default([]),
    thumbnailUrl: text("thumbnail_url"),
    galleryUrls: text("gallery_urls").array().default([]),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    currency: text("currency").default("USD").notNull(),
    contentLanguages: text("content_languages").array().default([]),
    licenseType: licenseType("license_type").default("personal_use").notNull(),
    downloadLimit: integer("download_limit").default(5).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    salesCount: integer("sales_count").default(0).notNull(),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).default("0"),
    ratingCount: integer("rating_count").default(0).notNull(),
    searchText: tsvector("search_text"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
    categoryIdx: index("products_category_idx").on(t.categoryId),
    statusIdx: index("products_status_idx").on(t.status),
    typeIdx: index("products_type_idx").on(t.type),
    featuredIdx: index("products_featured_idx").on(t.isFeatured),
    searchIdx: index("products_search_idx").using("gin", t.searchText),
  }),
);

export const productFiles = pgTable("product_files", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  mime: text("mime"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    status: orderStatus("status").default("pending").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    paymentProvider: paymentProvider("payment_provider"),
    paymentIntentId: text("payment_intent_id"),
    couponId: uuid("coupon_id"),
    email: text("email"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("orders_user_idx").on(t.userId),
    statusIdx: index("orders_status_idx").on(t.status),
    intentIdx: uniqueIndex("orders_intent_idx").on(t.paymentIntentId),
  }),
);

export const orderItems = pgTable("order_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  titleSnapshot: jsonb("title_snapshot")
    .$type<LocalizedField>()
    .notNull()
    .default({}),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const downloads = pgTable("downloads", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  fileId: uuid("file_id")
    .notNull()
    .references(() => productFiles.id, { onDelete: "cascade" }),
  downloadCount: integer("download_count").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastDownloadedAt: timestamp("last_downloaded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
  discountType: couponDiscountType("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  minOrderCents: integer("min_order_cents").default(0).notNull(),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  rating: integer("rating").notNull(),
  body: text("body"),
  status: reviewStatus("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const aiJobs = pgTable("ai_jobs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  agent: text("agent").notNull(),
  status: aiJobStatus("status").default("queued").notNull(),
  input: jsonb("input").default({}),
  output: jsonb("output").default({}),
  error: text("error"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 4 }).default("0"),
  durationMs: integer("duration_ms"),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: uuid("actor_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  diff: jsonb("diff").default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  preferredLocale: text("preferred_locale").default("en").notNull(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

// ----- inferred row types -----------------------------------------------------
export type ProfileRow = typeof profiles.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type ProductFileRow = typeof productFiles.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type DownloadRow = typeof downloads.$inferSelect;
export type CouponRow = typeof coupons.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type AiJobRow = typeof aiJobs.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
