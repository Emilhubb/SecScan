import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    await pool.query("SELECT 1");
    return Response.json({ service: "SecScan Neon Function", database: "connected" });
  } catch {
    return Response.json({ error: "Database unavailable." }, { status: 503 });
  }
}
