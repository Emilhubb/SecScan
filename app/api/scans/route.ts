import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

export async function GET() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to view cloud history." }, { status: 401 });
  }

  const { rows } = await db.query(
    `SELECT id, url, scanned_at AS "scannedAt", duration_ms AS "durationMs",
            score, grade, redirect_chain AS "redirectChain", findings
       FROM scan_results
      WHERE user_id = $1
      ORDER BY scanned_at DESC
      LIMIT 25`,
    [session.user.id],
  );
  return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
}
