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

function analyzeCsp(rawPolicy: string) {
  const directives = new Map<string, string[]>();
  for (const part of rawPolicy.toLowerCase().split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives.set(name, sources);
  }

  const scriptDirective = directives.has("script-src-elem")
    ? "script-src-elem"
    : directives.has("script-src")
      ? "script-src"
      : "default-src";
  const styleDirective = directives.has("style-src-elem")
    ? "style-src-elem"
    : directives.has("style-src")
      ? "style-src"
      : "default-src";
  const scriptSources = directives.get(scriptDirective) ?? [];
  const styleSources = directives.get(styleDirective) ?? [];
  const nonceOrHash = (source: string) => /^'(?:nonce-[^']+|sha(?:256|384|512)-[^']+)'$/.test(source);
  const issues: { message: string; severity: Severity; fix: string }[] = [];

  if (scriptSources.includes("'unsafe-inline'") && !scriptSources.some(nonceOrHash)) {
    issues.push({
      message: `'unsafe-inline' is enabled in ${scriptDirective}, allowing inline scripts without a matching nonce or hash.`,
      severity: "high",
      fix: "Replace the script policy with a nonce or hash based policy, for example: script-src 'self' 'nonce-{random}' 'strict-dynamic'. Generate a new unpredictable nonce for each response.",
    });
  }
  if (scriptSources.includes("'unsafe-eval'")) {
    issues.push({
      message: `'unsafe-eval' is enabled in ${scriptDirective}, allowing string evaluation as script.`,
      severity: "high",
      fix: `Remove 'unsafe-eval' from ${scriptDirective}; refactor code that uses eval() or string-based timers.`,
    });
  }
  if (styleSources.includes("'unsafe-inline'")) {
    issues.push({
      message: `'unsafe-inline' is enabled in ${styleDirective}; this permits inline styles.`,
      severity: "low",
      fix: "If practical, replace inline styles with a nonce based policy, for example: style-src 'self' 'nonce-{random}'. Generate a new unpredictable nonce for each response.",
    });
  }

  for (const [name, sources] of directives) {
    if (sources.some((source) => source === "*" || source === "https:" || source === "http:")) {
      issues.push({
        message: `A broad source is allowed by ${name}.`,
        severity: "high",
        fix: `Replace broad sources in ${name} with the specific origins this site requires.`,
      });
    }
  }
  for (const name of ["default-src", "object-src", "base-uri", "frame-ancestors"]) {
    if (!directives.has(name)) {
      issues.push({
        message: `The ${name} directive is missing.`,
        severity: "low",
        fix: `Add a ${name} directive with the narrowest sources the site needs.`,
      });
    }
  }
  return issues;
}

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
  statusCode: number | undefined;
  protocol: string | null;
  certificate: PeerCertificate | undefined;
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
        const socket = response.socket as TLSSocket;
        const peerCertificate = socket.getPeerCertificate();
        const certificate = peerCertificate.valid_to ? peerCertificate : undefined;
        resolve({
          headers: response.headers,
          statusCode: response.statusCode,
          protocol: socket.getProtocol(),
          certificate,
        });
        response.resume();
      },
    );
    request.on("timeout", () =>
      request.destroy(new Error("The website took too long to respond.")),
    );
    request.on("error", reject);
    request.end();
  });
}

function validateRedirectTarget(target: URL, protocol: "http:" | "https:") {
  if (
    target.protocol !== protocol ||
    target.username ||
    target.password ||
    target.port ||
    !target.hostname ||
    target.hostname.endsWith(".local") ||
    target.hostname.endsWith(".localhost")
  ) {
    throw new Error("The site returned an unsupported or unsafe redirect.");
  }
}

async function readFinalHttpsResponse(hostname: string) {
  let current = new URL(`https://${hostname}/`);
  const redirectChain: string[] = [];
  const visited = new Set<string>();

  for (let hop = 0; hop <= 5; hop += 1) {
    const key = current.href;
    if (visited.has(key)) throw new Error("The site returned a redirect loop.");
    visited.add(key);
    redirectChain.push(current.origin);
    const address = await getPublicAddress(current.hostname);
    const response = await readHeaders(current.hostname, address);
    const location = response.headers.location;
    if (
      response.statusCode !== undefined &&
      response.statusCode >= 300 &&
      response.statusCode < 400 &&
      location
    ) {
      const next = new URL(location, current);
      if (next.protocol === "https:") {
        validateRedirectTarget(next, "https:");
        if (hop === 5) throw new Error("The site returned too many redirects.");
        current = next;
        continue;
      }
    }
    return { ...response, finalHostname: current.hostname, redirectChain };
  }
  throw new Error("The site returned too many redirects.");
}

async function redirectsToHttps(hostname: string): Promise<{
  result: "pass" | "fail" | "info";
  chain: string[];
  detail: string;
}> {
  let current = new URL(`http://${hostname}/`);
  const chain: string[] = [];
  const visited = new Set<string>();
  try {
    for (let hop = 0; hop <= 5; hop += 1) {
      if (visited.has(current.href)) {
        return { result: "fail", chain, detail: "The HTTP redirect chain contains a loop." };
      }
      visited.add(current.href);
      chain.push(current.origin);
      const address = await getPublicAddress(current.hostname);
      const response = await new Promise<{ statusCode?: number; location?: string }>((resolve, reject) => {
        const request = http.request({
          hostname: current.hostname,
          path: `${current.pathname}${current.search}`,
          method: "HEAD",
          timeout: 5000,
          lookup: (_host, options, callback) => {
            if (typeof options === "object" && options.all) callback(null, [{ address, family: 4 }]);
            else callback(null, address, 4);
          },
        }, (incoming) => {
          const data = { statusCode: incoming.statusCode, location: incoming.headers.location };
          incoming.resume();
          resolve(data);
        });
        request.on("timeout", () => request.destroy(new Error("HTTP redirect check timed out.")));
        request.on("error", reject);
        request.end();
      });
      if (response.statusCode !== undefined && response.statusCode >= 300 && response.statusCode < 400 && response.location) {
        const next = new URL(response.location, current);
        if (next.protocol === "https:") {
          validateRedirectTarget(next, "https:");
          chain.push(next.origin);
          return { result: "pass", chain, detail: "HTTP redirects to HTTPS." };
        }
        validateRedirectTarget(next, "http:");
        if (hop === 5) return { result: "fail", chain, detail: "The HTTP redirect chain exceeded five hops." };
        current = next;
        continue;
      }
      return { result: "fail", chain, detail: `HTTP returned ${response.statusCode ?? "no status"} without redirecting to HTTPS.` };
    }
  } catch (error) {
    return {
      result: "info",
      chain,
      detail: error instanceof Error ? `Could not verify the HTTP redirect: ${error.message}` : "Could not verify the HTTP redirect.",
    };
  }
  return { result: "info", chain, detail: "Could not verify the HTTP redirect." };
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
    const { headers, protocol, certificate, finalHostname, redirectChain } = await readFinalHttpsResponse(hostname);
    const findings: Finding[] = checks.map((check) => {
      const rawValue = String(headers[check.header] ?? "");
      const value = rawValue.toLowerCase();
      let present = Boolean(value);
      let description = `${check.header} is present in the HTTPS response.`;
      let fix = check.fix;
      let severity = check.severity;
      if (check.header === "content-security-policy") {
        if (!rawValue) {
          present = false;
          description = `No Content-Security-Policy header was returned by https://${finalHostname}/ after following redirects.`;
          fix = `Configure a CSP for ${hostname}. Example starting point: ${check.fix} — adapt allowed sources to the site's scripts, styles, images, and APIs before deploying.`;
        } else {
          const issues = analyzeCsp(rawValue);
          const weaknesses = issues.map((issue) => issue.message);
          present = issues.length === 0;
          description = present
            ? `A CSP was returned by ${finalHostname}: ${rawValue.slice(0, 240)}${rawValue.length > 240 ? "…" : ""}`
            : `The CSP returned by ${finalHostname} has these weaknesses: ${weaknesses.join(", ")}. Policy: ${rawValue.slice(0, 240)}${rawValue.length > 240 ? "…" : ""}`;
          if (!present) {
            severity = issues.some((issue) => issue.severity === "high") ? "high" : "low";
            fix = issues.map((issue) => issue.fix).join(" ");
          }
        }
      }
      if (check.header === "strict-transport-security" && !value) {
        present = false;
        description = `The Strict-Transport-Security header is missing from ${finalHostname}'s HTTPS response.`;
      } else if (check.header === "strict-transport-security" && (!/max-age\s*=\s*\d+/i.test(value) || /max-age\s*=\s*0(?:\D|$)/i.test(value))) {
        present = false;
        description = "The HSTS header has no usable max-age or disables HSTS with max-age=0.";
      }
      if (check.header === "x-frame-options") {
        const csp = String(headers["content-security-policy"] ?? "").toLowerCase();
        present = ["deny", "sameorigin"].includes(value.trim()) || /(?:^|;)\s*frame-ancestors\s+[^;]+/.test(csp);
        if (!present) description = "Neither a valid X-Frame-Options value nor a CSP frame-ancestors directive was found.";
      }
      return {
        id: check.header,
        title: check.title,
        severity: present ? "pass" : severity,
        description: present ? description : (description === `${check.header} is present in the HTTPS response.` ? check.advice : description),
        fix: present ? undefined : fix,
      };
    });
    const addFinding = (id: string, title: string, ok: boolean, severity: Severity, description: string, fix: string) => findings.push({ id, title, severity: ok ? "pass" : severity, description: ok ? `${title} check passed.` : description, fix: ok ? undefined : fix });
    const cookies = headers["set-cookie"] ?? [];
    for (const [flag, label] of [["secure", "Secure"], ["httponly", "HttpOnly"], ["samesite", "SameSite"]] as const) {
      if (cookies.length === 0) {
        findings.push({
          id: `cookie-${flag}`,
          title: `Cookie ${label} flag`,
          severity: "info",
          description: `Not applicable: ${finalHostname}'s final HTTPS response did not set any cookies.`,
        });
        continue;
      }
      const missing = cookies.filter((cookie) => !cookie.toLowerCase().split(";").some((part) => part.trim().startsWith(`${flag}=`) || part.trim() === flag));
      addFinding(`cookie-${flag}`, `Cookie ${label} flag`, missing.length === 0, flag === "secure" || flag === "httponly" ? "medium" : "low", `${missing.length} of ${cookies.length} cookies are missing the ${label} flag.`, `Set-Cookie: session=...; ${label}${flag === "samesite" ? "=Lax" : ""}`);
    }
    const server = String(headers.server ?? "");
    const poweredBy = String(headers["x-powered-by"] ?? "");
    addFinding("server-version", "Server version disclosure", !/\d/.test(server), "low", `The Server header exposes implementation details: ${server}.`, "Remove or generalize the Server response header.");
    addFinding("x-powered-by", "Technology disclosure", !poweredBy, "low", `X-Powered-By exposes: ${poweredBy}.`, "Remove the X-Powered-By response header.");
    const modernTls = protocol === "TLSv1.2" || protocol === "TLSv1.3";
    addFinding("tls-version", "TLS protocol version", modernTls, "high", `The connection negotiated ${protocol ?? "an unknown TLS version"}; use TLS 1.2 or newer.`, "Configure the server to allow TLS 1.2 and TLS 1.3 only.");
    const expiry = certificate?.valid_to ? Date.parse(certificate.valid_to) : NaN;
    if (!Number.isFinite(expiry)) {
      findings.push({
        id: "certificate-expiry",
        title: "TLS certificate expiry",
        severity: "info",
        description: `The scanner could not read the certificate expiry from ${finalHostname}; this does not count as a site finding.`,
      });
    } else {
      const daysLeft = Math.floor((expiry - Date.now()) / 86400000);
      addFinding("certificate-expiry", "TLS certificate expiry", daysLeft > 30, daysLeft <= 0 ? "high" : "medium", `The certificate expires in ${daysLeft} days.`, "Renew the TLS certificate before it expires.");
    }
    const httpRedirect = await redirectsToHttps(hostname);
    if (httpRedirect.result === "info") {
      findings.push({ id: "http-https-redirect", title: "HTTP to HTTPS redirect", severity: "info", description: httpRedirect.detail });
    } else {
      addFinding("http-https-redirect", "HTTP to HTTPS redirect", httpRedirect.result === "pass", "medium", httpRedirect.detail, "Configure HTTP to redirect to HTTPS, allowing an intermediate HTTP redirect such as the www hostname change.");
    }
    const penalty: Record<Severity, number> = {
      high: 15,
      medium: 6,
      low: 2,
      pass: 0,
      info: 0,
    };

    const score = Math.max(
      0,
      100 - findings.reduce((sum, f) => sum + penalty[f.severity], 0),
    );
    const result: ScanResult = {
      id: randomUUID(),
      url: hostname,
      redirectChain,
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
