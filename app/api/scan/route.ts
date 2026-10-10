import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import { isIP } from "node:net";
import https from "node:https";
import http from "node:http";
import type { PeerCertificate, TLSSocket } from "node:tls";
import type { Finding, ScanResult, Severity } from "@/types";
import { getGrade } from "@/lib/grades";

const checks: {
  title: string;
  header: string;
  severity: Severity;
  advice: string;
  fix: string;
}[] = [
  {
    title: "Content Security Policy",
    header: "content-security-policy",
    severity: "high",
    advice:
      "Add a Content-Security-Policy that limits the sources browsers may load.",
    fix: "Content-Security-Policy: default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
  {
    title: "Strict Transport Security",
    header: "strict-transport-security",
    severity: "high",
    advice: "Enable HSTS so browsers keep using HTTPS.",
    fix: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  },
  {
    title: "Clickjacking protection",
    header: "x-frame-options",
    severity: "medium",
    advice:
      "Set X-Frame-Options or use frame-ancestors in Content-Security-Policy.",
    fix: "X-Frame-Options: DENY (or set frame-ancestors 'none' in Content-Security-Policy)",
  },
  {
    title: "MIME sniffing protection",
    header: "x-content-type-options",
    severity: "medium",
    advice: "Set X-Content-Type-Options: nosniff.",
    fix: "X-Content-Type-Options: nosniff",
  },
  {
    title: "Referrer policy",
    header: "referrer-policy",
    severity: "low",
    advice:
      "Set a restrictive Referrer-Policy, such as strict-origin-when-cross-origin.",
    fix: "Referrer-Policy: strict-origin-when-cross-origin",
  },
  {
    title: "Permissions policy",
    header: "permissions-policy",
    severity: "low",
    advice:
      "Set a Permissions-Policy that disables browser features your site does not use.",
    fix: "Permissions-Policy: camera=(), microphone=(), geolocation=()",
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

async function readHeaders(hostname: string, address: string): Promise<{
  headers: IncomingHttpHeaders;
  protocol: string | null;
  certificate: PeerCertificate;
}> {
  return new Promise((resolve, reject) => {
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
        const socket = response.socket as TLSSocket;
        const certificate = socket.getPeerCertificate();
        resolve({
          headers: response.headers,
          protocol: socket.getProtocol(),
          certificate,
        });
      },
    );
    request.on("timeout", () =>
      request.destroy(new Error("The website took too long to respond.")),
    );
    request.on("error", reject);
    request.end();
  });
}

async function redirectsToHttps(hostname: string, address: string) {
  return new Promise<boolean>((resolve) => {
    const request = http.request({
      hostname,
      path: "/",
      method: "HEAD",
      timeout: 5000,
      lookup: (_host, options, callback) => {
        if (typeof options === "object" && options.all) callback(null, [{ address, family: 4 }]);
        else callback(null, address, 4);
      },
    }, (response) => {
      response.resume();
      const location = response.headers.location;
      resolve(response.statusCode !== undefined && response.statusCode >= 300 && response.statusCode < 400 && Boolean(location) && /^https:\/\//i.test(location!));
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
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
    const address = await getPublicAddress(hostname);
    const { headers, protocol, certificate } = await readHeaders(hostname, address);
    const findings: Finding[] = checks.map((check) => {
      const value = String(headers[check.header] ?? "").toLowerCase();
      let present = Boolean(value);
      let description = `${check.header} is present in the HTTPS response.`;
      if (check.header === "content-security-policy" && (value.includes("'unsafe-inline'") || value.includes("'unsafe-eval'"))) {
        present = false;
        description = "The Content-Security-Policy allows unsafe-inline or unsafe-eval, which weakens script protections.";
      }
      if (check.header === "strict-transport-security" && (!/max-age\s*=\s*\d+/i.test(value) || /max-age\s*=\s*0(?:\D|$)/i.test(value))) {
        present = false;
        description = "HSTS is missing a usable max-age or disables it with max-age=0.";
      }
      if (check.header === "x-frame-options") {
        const csp = String(headers["content-security-policy"] ?? "").toLowerCase();
        present = ["deny", "sameorigin"].includes(value.trim()) || /(?:^|;)\s*frame-ancestors\s+[^;]+/.test(csp);
        if (!present) description = "Neither a valid X-Frame-Options value nor a CSP frame-ancestors directive was found.";
      }
      return {
        id: check.header,
        title: check.title,
        severity: present ? "pass" : check.severity,
        description: present ? description : (description === `${check.header} is present in the HTTPS response.` ? check.advice : description),
        fix: present ? undefined : check.fix,
      };
    });
    const addFinding = (id: string, title: string, ok: boolean, severity: Severity, description: string, fix: string) => findings.push({ id, title, severity: ok ? "pass" : severity, description: ok ? `${title} check passed.` : description, fix: ok ? undefined : fix });
    const cookies = headers["set-cookie"] ?? [];
    for (const [flag, label] of [["secure", "Secure"], ["httponly", "HttpOnly"], ["samesite", "SameSite"]] as const) {
      const missing = cookies.filter((cookie) => !cookie.toLowerCase().split(";").some((part) => part.trim().startsWith(`${flag}=`) || part.trim() === flag));
      addFinding(`cookie-${flag}`, `Cookie ${label} flag`, cookies.length === 0 || missing.length === 0, flag === "secure" || flag === "httponly" ? "medium" : "low", cookies.length === 0 ? `No Set-Cookie header was returned, so ${label} could not be verified.` : `${missing.length} of ${cookies.length} cookies are missing the ${label} flag.`, `Set-Cookie: session=...; ${label}${flag === "samesite" ? "=Lax" : ""}`);
    }
    const server = String(headers.server ?? "");
    const poweredBy = String(headers["x-powered-by"] ?? "");
    addFinding("server-version", "Server version disclosure", !/\d/.test(server), "low", `The Server header exposes implementation details: ${server}.`, "Remove or generalize the Server response header.");
    addFinding("x-powered-by", "Technology disclosure", !poweredBy, "low", `X-Powered-By exposes: ${poweredBy}.`, "Remove the X-Powered-By response header.");
    const modernTls = protocol === "TLSv1.2" || protocol === "TLSv1.3";
    addFinding("tls-version", "TLS protocol version", modernTls, "high", `The connection negotiated ${protocol ?? "an unknown TLS version"}; use TLS 1.2 or newer.`, "Configure the server to allow TLS 1.2 and TLS 1.3 only.");
    const expiry = certificate?.valid_to ? Date.parse(certificate.valid_to) : NaN;
    const daysLeft = Math.floor((expiry - Date.now()) / 86400000);
    addFinding("certificate-expiry", "TLS certificate expiry", Number.isFinite(expiry) && daysLeft > 30, daysLeft <= 0 ? "high" : "medium", Number.isFinite(expiry) ? `The certificate expires in ${daysLeft} days.` : "The certificate expiry could not be read.", "Renew the TLS certificate before it expires.");
    const redirects = await redirectsToHttps(hostname, address);
    addFinding("http-https-redirect", "HTTP to HTTPS redirect", redirects, "medium", "HTTP does not redirect to the HTTPS site.", "Configure the HTTP virtual host to return a permanent redirect to the same HTTPS URL.");
    const penalty: Record<Severity, number> = {
      high: 25,
      medium: 12,
      low: 5,
      pass: 0,
    };

    const score = Math.max(
      0,
      100 - findings.reduce((sum, f) => sum + penalty[f.severity], 0),
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
