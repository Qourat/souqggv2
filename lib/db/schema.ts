import { pgTable, text, uuid, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull(),
  display_name: text('display_name'),
  stripe_account_id: text('stripe_account_id'),
  stripe_onboarded: boolean('stripe_onboarded').default(false),
});

export const categories = pgTable('categories', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  seller_id: uuid('seller_id').notNull(),
  category_id: integer('category_id'),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull(),
  price_cents: integer('price_cents').notNull(),
  upvotes: integer('upvotes').default(0),
  status: text('status').default('active'),
  created_at: timestamp('created_at').defaultNow(),
});
