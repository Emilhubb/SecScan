import { rawSql, createRealtime } from "@neon/realtime/server";
import { getAuth } from "@/lib/auth/server";

export async function POST() {
  try {
    const { data: session } = await getAuth().getSession();
    if (!session?.user) {
      return Response.json({ error: "Sign in to subscribe to cloud history." }, { status: 401 });
    }

    const realtimeUrl = process.env.NEON_REALTIME_URL;
    const secret = process.env.NEON_REALTIME_SECRET;
    const databaseUrl = process.env.DATABASE_URL;
    if (!realtimeUrl || !secret || !databaseUrl) {
      return Response.json({ error: "Cloud history is not configured on the server." }, { status: 503 });
    }

    const databaseName = new URL(databaseUrl).pathname.slice(1);
    if (!databaseName) {
      return Response.json({ error: "Cloud history database configuration is invalid." }, { status: 503 });
    }

    const realtime = createRealtime({ secret, db: databaseName });
    const query = rawSql(
      `SELECT id, url, scanned_at AS "scannedAt", duration_ms AS "durationMs",
            score, grade, redirect_chain AS "redirectChain", findings
       FROM scan_results
      WHERE user_id = $1
      ORDER BY scanned_at DESC
      LIMIT 25`,
      [session.user.id],
    );
    const sealedQuery = await realtime.seal({ query });
    return Response.json({ url: realtimeUrl, query: sealedQuery }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("cloud history subscription failed", error);
    return Response.json(
      { error: "Could not connect to cloud history. Check the server configuration and try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
