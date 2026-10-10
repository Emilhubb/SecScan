import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import { isIP } from "node:net";
import https from "node:https";
import type { Finding, ScanResult, Severity } from "@/types";
import { getGrade } from "@/lib/grades";

const checks: {
  title: string;
  header: string;
  severity: Severity;
  advice: string;
}[] = [
  {
    title: "Content Security Policy",
    header: "content-security-policy",
    severity: "high",
    advice:
      "Add a Content-Security-Policy that limits the sources browsers may load.",
  },
  {
    title: "Strict Transport Security",
    header: "strict-transport-security",
    severity: "high",
    advice: "Enable HSTS so browsers keep using HTTPS.",
  },
  {
    title: "Clickjacking protection",
    header: "x-frame-options",
    severity: "medium",
    advice:
      "Set X-Frame-Options or use frame-ancestors in Content-Security-Policy.",
  },
  {
    title: "MIME sniffing protection",
    header: "x-content-type-options",
    severity: "medium",
    advice: "Set X-Content-Type-Options: nosniff.",
  },
  {
    title: "Referrer policy",
    header: "referrer-policy",
    severity: "low",
    advice:
      "Set a restrictive Referrer-Policy, such as strict-origin-when-cross-origin.",
  },
  {
    title: "Permissions policy",
    header: "permissions-policy",
    severity: "low",
    advice:
      "Set a Permissions-Policy that disables browser features your site does not use.",
  },
];

function isPublicIPv4(address: string) {
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function getPublicAddress(hostname: string) {
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isIP(hostname)
  ) {
    throw new Error("Enter a public domain name, such as example.com.");
  }
  const records = await lookup(hostname, { all: true, verbatim: true });
  const record = records.find(
    ({ address, family }) => family === 4 && isPublicIPv4(address),
  );
  if (!record)
    throw new Error("This domain does not resolve to a public IPv4 address.");
  return record.address;
}

async function readHeaders(hostname: string) {
  const address = await getPublicAddress(hostname);
  return new Promise<IncomingHttpHeaders>((resolve, reject) => {
    const request = https.request(
      {
        hostname,
        path: "/",
        method: "HEAD",
        servername: hostname,
        timeout: 8000,
        lookup: (_host, options, callback) => {
          if (typeof options === "object" && options.all) {
            callback(null, [{ address, family: 4 }]);
            return;
          }
          callback(null, address, 4);
        },
      },
      (response) => {
        response.resume();
        resolve(response.headers);
      },
    );
    request.on("timeout", () =>
      request.destroy(new Error("The website took too long to respond.")),
    );
    request.on("error", reject);
    request.end();
  });
}

export async function POST(request: Request) {
  let domain: unknown;
  try {
    domain = (await request.json())?.domain;
  } catch {
    return Response.json(
      { error: "Send a valid JSON body with a domain." },
      { status: 400 },
    );
  }
  if (typeof domain !== "string" || domain.length > 253) {
    return Response.json(
      { error: "Enter a valid public domain name." },
      { status: 400 },
    );
  }

  const input = domain.trim();
  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return Response.json(
      { error: "Enter a valid domain, such as example.com." },
      { status: 400 },
    );
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    return Response.json(
      { error: "Enter a domain only; HTTPS is checked automatically." },
      { status: 400 },
    );
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
      hostname,
    )
  ) {
    return Response.json(
      { error: "Enter a valid public domain name." },
      { status: 400 },
    );
  }

  const startedAt = Date.now();
  try {
    const headers = await readHeaders(hostname);
    const findings: Finding[] = checks.map((check) => {
      const present = Boolean(headers[check.header]);
      return {
        id: check.header,
        title: check.title,
        severity: present ? "pass" : check.severity,
        description: present
          ? `${check.header} is present in the HTTPS response.`
          : check.advice,
      };
    });
    const score = Math.round(
      (findings.filter(({ severity }) => severity === "pass").length /
        checks.length) *
        100,
    );
    const result: ScanResult = {
      id: randomUUID(),
      url: hostname,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      score,
      grade: getGrade(score).grade,
      findings,
    };
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect to that domain over HTTPS.";
    const publicError = /public|domain|IPv4|localhost/i.test(message);
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    const networkError = ["EACCES", "ENETUNREACH", "EHOSTUNREACH"].includes(
      code,
    );
    const timeoutError =
      code === "ETIMEDOUT" || message.includes("too long to respond");
    const errorMessage = publicError
      ? message
      : networkError
        ? "The scanner server cannot reach external websites. Enable outbound HTTPS access and try again."
        : timeoutError
          ? "The website did not respond in time. Try again later."
          : "Could not establish a secure HTTPS connection to that domain.";
    return Response.json({ error: errorMessage }, { status: 422 });
  }
}
