"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { ScanResult as ScanResultData } from "@/types";

export default function ScanForm({ onComplete }: { onComplete: (result: ScanResultData) => void }) {
  const [domain, setDomain] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The scan failed.");
      onComplete(result as ScanResultData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The scan failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="w-full" aria-labelledby="scan-heading">
      <div className="flex w-full flex-col gap-4 p-4 sm:p-6">
        <h1 id="scan-heading" className="text-3xl font-medium text-white sm:text-4xl">Check a website’s security headers</h1>
        <p className="text-lg text-slate-400">Runs a limited HTTPS and security-header check against a public domain.</p>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="domain">Domain to scan</label>
          <label className="sr-only" htmlFor="domain">Domain to scan</label>
          <input id="domain" name="domain" type="text" autoComplete="url" placeholder="example.com" value={domain} onChange={(event) => setDomain(event.target.value)} required maxLength={253} aria-describedby={error ? "scan-error" : undefined} className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          <button type="submit" disabled={pending} className="shrink-0 rounded-lg bg-violet-500 px-5 py-2.5 text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-wait disabled:opacity-60">
            {pending ? "Scanning…" : "Scan Now"}
          </button>
        </form>
        {error && <p id="scan-error" role="alert" className="text-sm text-rose-300">{error}</p>}
      </div>
    </section>
  );
}
