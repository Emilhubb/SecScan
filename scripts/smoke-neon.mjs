import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createRealtime, rawSql } from "@neon/realtime/server";
import { Pool } from "pg";

const required = [
  "DATABASE_URL", "NEON_AUTH_BASE_URL", "AWS_ENDPOINT_URL_S3", "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET", "NEON_AI_GATEWAY_BASE_URL",
  "NEON_AI_GATEWAY_TOKEN", "NEON_REALTIME_URL", "NEON_REALTIME_SECRET",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing Neon variables: ${missing.join(", ")}`);

const passed = [];
const failures = [];
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
let realtime;
let subscription;
let objectKey;

try {
  await pool.query("SELECT 1 AS connected FROM scan_results LIMIT 1");
  passed.push("Postgres: connected to scan_results");

  const authResponse = await fetch(`${process.env.NEON_AUTH_BASE_URL}/get-session`, { cache: "no-store" });
  if (!authResponse.ok) throw new Error(`Managed Auth returned HTTP ${authResponse.status}`);
  await authResponse.arrayBuffer();
  passed.push("Managed Auth: session endpoint responded");

  const s3 = new S3Client({ forcePathStyle: true });
  const keyId = randomUUID();
  objectKey = `smoke/${keyId}.txt`;
  const body = Buffer.from(`SecScan Neon smoke check ${keyId}`);
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey, Body: body, ContentType: "text/plain" }));
  const stored = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey }));
  if (!stored.Body) throw new Error("Neon Storage returned an empty object body.");
  const received = Buffer.from(await stored.Body.transformToByteArray());
  if (!received.equals(body)) throw new Error("Neon Storage returned different file content.");
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey }));
  objectKey = undefined;
  s3.destroy();
  passed.push("Object Storage: upload, read, and delete succeeded");

  const gateway = process.env.NEON_AI_GATEWAY_BASE_URL;
  const headers = { Authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}` };
  const catalogResponse = await fetch(`${gateway}/v1/models`, { headers, cache: "no-store" });
  if (!catalogResponse.ok) throw new Error(`AI Gateway catalog returned HTTP ${catalogResponse.status}`);
  const catalog = await catalogResponse.json();
  const model = catalog.data?.find((entry) => entry.enabled && typeof entry.id === "string")?.id;
  if (!model) failures.push("AI Gateway: catalog responds, but the account has no enabled model for inference");
  else passed.push("AI Gateway: model catalog lists an enabled model");

  realtime = createRealtime({
    url: process.env.NEON_REALTIME_URL,
    secret: process.env.NEON_REALTIME_SECRET,
    db: new URL(process.env.DATABASE_URL).pathname.slice(1),
  });
  const probeUrl = `realtime-smoke-${randomUUID()}.example`;
  const query = rawSql("SELECT url FROM scan_results WHERE url = $1", [probeUrl]);
  subscription = await realtime.subscribe(query);
  await subscription.awaitRows((rows) => rows.length === 0, 20_000);
  const id = randomUUID();
  await pool.query(
    `INSERT INTO scan_results (id, url, scanned_at, duration_ms, score, grade, findings)
     VALUES ($1, $2, now(), 0, 100, 'A', '[]'::jsonb)`,
    [id, probeUrl],
  );
  await subscription.awaitRows((rows) => rows.some((row) => row.url === probeUrl), 20_000);
  await pool.query("DELETE FROM scan_results WHERE id = $1", [id]);
  await subscription.awaitRows((rows) => rows.length === 0, 20_000);
  passed.push("Realtime: subscription received a Postgres insert and delete");

  const functionUrl = process.env.NEON_FUNCTION_URL ?? "http://127.0.0.1:3001/";
  const functionResponse = await fetch(functionUrl, { cache: "no-store" });
  const functionResult = await functionResponse.json();
  if (!functionResponse.ok || functionResult.database !== "connected") throw new Error(`Neon Function returned HTTP ${functionResponse.status}`);
  passed.push("Neon Function: HTTP endpoint queried Postgres successfully");
} catch (error) {
  console.error(`Neon smoke check failed: ${error instanceof Error ? error.message : "unknown error"}`);
  if (error instanceof Error && error.stack) console.error(error.stack);
  for (const check of passed) console.log(`PASS ${check}`);
  process.exitCode = 1;
} finally {
  if (subscription) await subscription.unsubscribe();
  realtime?.close();
  if (objectKey) {
    const s3 = new S3Client({ forcePathStyle: true });
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey })).catch(() => {});
    s3.destroy();
  }
  await pool.end();
}

if (!process.exitCode) for (const check of passed) console.log(`PASS ${check}`);
for (const failure of failures) console.log(`BLOCKED ${failure}`);
if (failures.length) process.exitCode = 1;
