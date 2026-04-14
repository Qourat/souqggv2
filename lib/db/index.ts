import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://souq_user:souq_secure_2026@localhost:5432/souq';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
