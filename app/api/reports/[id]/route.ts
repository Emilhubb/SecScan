import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { storage, storageBucket } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response("Sign in required.", { status: 401 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found.", { status: 404 });
  const { rows } = await db.query(
    "SELECT report_key FROM scan_results WHERE id = $1 AND user_id = $2",
    [id, session.user.id],
  );
  const key = rows[0]?.report_key as string | undefined;
  if (!key || !key.startsWith(`reports/${session.user.id}/`)) {
    return new Response("Not found.", { status: 404 });
  }

  const object = await storage.send(new GetObjectCommand({ Bucket: storageBucket, Key: key }));
  if (!object.Body) return new Response("Not found.", { status: 404 });
  const bytes = await object.Body.transformToByteArray();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": object.ContentDisposition ?? "attachment; filename=secscan-report.pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
