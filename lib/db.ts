import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & { secScanPool?: Pool };

export const db =
  globalForDb.secScanPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.secScanPool = db;
