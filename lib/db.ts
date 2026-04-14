import postgres from "postgres";

const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql = globalForPostgres.sql ?? postgres(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.sql = sql;
}

export default sql;