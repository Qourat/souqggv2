import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/shared/env";

import * as schema from "./schema";

/**
 * Drizzle client over the raw connection string. Bypasses RLS — use it
 * only from trusted server code (background jobs, admin reports, scripts).
 */
const connectionString = env.DATABASE_URL ?? "";

const client = connectionString
  ? postgres(connectionString, { prepare: false })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
export { schema };
