import { Pool } from "pg";

const origin = process.env.SECSCAN_ORIGIN ?? "http://127.0.0.1:3000";
const checks = [];
const blocked = [];
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL,
  max: 1,
});

async function check(name, action) {
  await action();
  checks.push(name);
}

await check("Built homepage responds", async () => {
  const response = await fetch(origin);
  if (!response.ok) throw new Error(`Homepage returned HTTP ${response.status}`);
});

await check("Managed Auth UI and session proxy respond", async () => {
  const [page, session] = await Promise.all([
    fetch(`${origin}/auth`),
    fetch(`${origin}/api/auth/get-session`, { cache: "no-store" }),
  ]);
  if (!page.ok) throw new Error(`Auth UI returned HTTP ${page.status}`);
  if (!session.ok) throw new Error(`Auth session proxy returned HTTP ${session.status}`);
});

await check("Scan route stores its result in Neon Postgres", async () => {
  let id;
  try {
    const response = await fetch(`${origin}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "example.com" }),
    });
    const result = await response.json();
    if (!response.ok || typeof result.id !== "string") {
      throw new Error(`Example domain scan returned HTTP ${response.status}`);
    }
    id = result.id;
    const stored = await pool.query("SELECT id FROM scan_results WHERE id = $1", [id]);
    if (stored.rowCount !== 1) throw new Error("Scan response was not persisted in Postgres.");
  } finally {
    if (id) await pool.query("DELETE FROM scan_results WHERE id = $1", [id]);
  }
});

await check("Private cloud-history endpoints reject signed-out callers", async () => {
  const scans = await fetch(`${origin}/api/scans`, { cache: "no-store" });
  const live = await fetch(`${origin}/api/scans/live`, { method: "POST", cache: "no-store" });
  if (scans.status !== 401 || live.status !== 401) {
    throw new Error(`Expected 401 from private history endpoints; got ${scans.status} and ${live.status}`);
  }
});

await check("AI summary route responds to scan data", async () => {
  const response = await fetch(`${origin}/api/scan/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "example.com",
      score: 82,
      grade: "B",
      findings: [{
        id: "missing-hsts",
        title: "Strict Transport Security",
        severity: "high",
        description: "The HTTPS response does not include an HSTS header.",
        fix: "Add Strict-Transport-Security with an appropriate max-age.",
      }],
    }),
  });
  const result = await response.json();
  if (response.status === 503 && result.error?.includes("enabled model")) {
    blocked.push("AI summary inference: Neon has no enabled model on this account");
    return;
  }
  if (!response.ok || typeof result.summary !== "string" || !result.summary.trim()) {
    throw new Error(`AI summary route returned HTTP ${response.status}`);
  }
});

for (const name of checks) console.log(`PASS ${name}`);
for (const reason of blocked) console.log(`BLOCKED ${reason}`);
if (blocked.length) process.exitCode = 1;
await pool.end();
