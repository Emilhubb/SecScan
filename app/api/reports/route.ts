import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { storage, storageBucket } from "@/lib/storage";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to save reports to Neon Storage." }, { status: 401 });
  }

  const form = await request.formData();
  const scanId = form.get("scanId");
  const file = form.get("file");
  if (
    typeof scanId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(scanId) ||
    !(file instanceof File) ||
    file.type !== "application/pdf" ||
    file.size < 1 ||
    file.size > 5 * 1024 * 1024
  ) {
    return Response.json({ error: "Provide a scan ID and a PDF smaller than 5 MB." }, { status: 400 });
  }

  const scan = await db.query(
    "SELECT id FROM scan_results WHERE id = $1 AND user_id = $2",
    [scanId, session.user.id],
  );
  if (scan.rowCount === 0) {
    return Response.json({ error: "This scan is not in your cloud history." }, { status: 404 });
  }

  const objectKey = `reports/${session.user.id}/${scanId}.pdf`;
  await storage.send(new PutObjectCommand({
    Bucket: storageBucket,
    Key: objectKey,
    Body: new Uint8Array(await file.arrayBuffer()),
    ContentType: "application/pdf",
    ContentDisposition: "attachment; filename=secscan-report.pdf",
  }));

  try {
    await db.query(
      "UPDATE scan_results SET report_key = $1 WHERE id = $2 AND user_id = $3",
      [objectKey, scanId, session.user.id],
    );
  } catch (error) {
    await storage.send(new DeleteObjectCommand({ Bucket: storageBucket, Key: objectKey }));
    throw error;
  }

  return Response.json({ url: `/api/reports/${scanId}` });
}
