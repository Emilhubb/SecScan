import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_POOLED;
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations.");

const pool = new Pool({ connectionString, max: 1 });
try {
  const migration = await readFile(
    new URL("../db/migrations/0001_scan_results.sql", import.meta.url),
    "utf8",
  );
  await pool.query(migration);
  console.log("Applied migration 0001_scan_results.sql");
} finally {
  await pool.end();
}
