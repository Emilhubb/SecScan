"use client";

import { useState } from "react";
import Link from "next/link";
import type { ScanResult as ScanResultData } from "@/types";
import ScanFindings from "@/components/Scan Components/ScanFindings";
import ScanForm from "@/components/Scan Components/ScanForm";
import ScanResult from "@/components/Scan Components/ScanResult";
import ScoreHistory from "@/components/Scan Components/ScoreHistory";

const HISTORY_KEY = "secscan-history";

export default function Home() {
  const [result, setResult] = useState<ScanResultData | null>(null);

  function saveResult(nextResult: ScanResultData) {
    setResult(nextResult);
    try {
      const previous = JSON.parse(
        localStorage.getItem(HISTORY_KEY) ?? "[]",
      ) as ScanResultData[];
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
          [
            nextResult,
            ...previous.filter((item) => item.url !== nextResult.url),
          ].slice(0, 25),
        ),
      );
      window.dispatchEvent(new Event("secscan-history-change"));
    } catch {}
  }

  return (
    <div className="mx-auto select-none flex min-h-full w-full max-w-7xl flex-col items-center gap-5 px-3 py-5 text-white sm:gap-7 sm:px-6 sm:py-8 lg:px-8">
      <header className="w-full max-w-4xl px-1 text-center sm:px-4">
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Check a website’s security configuration
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-[11px] leading-7 text-slate-300 sm:text-base">
          SecScan checks a public website’s HTTPS response, security headers,
          cookies, TLS certificate, and redirects. Get a security score with
          clear findings and practical suggestions.
        </p>
      </header>
      <ScanForm onComplete={saveResult} />
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 px-0 sm:px-2 md:grid-cols-2">
        <section aria-labelledby="how-secscan-works" className="w-full min-w-0 text-sm leading-7 text-slate-300">
          <details className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
            <summary
              id="how-secscan-works"
              className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left text-base font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden sm:text-lg"
            >
              <span>How SecScan works</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="size-5 shrink-0 text-violet-300 transition-transform group-open:rotate-180"
              >
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="mt-2">
              Enter a public domain to check common security headers, cookie
              settings, TLS details, and HTTP-to-HTTPS redirection. Results are
              a point-in-time snapshot from SecScan’s network location, not a
              penetration test, security guarantee, or compliance certification.
              Only scan sites you own or have permission to assess.
            </p>
            <Link
              href="/about"
              className="mt-3 inline-block font-medium text-violet-300 underline underline-offset-4 hover:text-violet-200"
            >
              What we check and result limitations
            </Link>
          </details>
        </section>
        <section aria-label="Accounts and your information" className="w-full min-w-0 text-sm leading-7 text-slate-300">
          <details className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left text-base font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden sm:text-lg">
              <span>Accounts and your information</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="size-5 shrink-0 text-violet-300 transition-transform group-open:rotate-180"
              >
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="mt-2">
              You can scan without signing in. SecScan processes the domain and
              scan results to run the check and show your score. Recent scans
              are kept in your browser; signing in lets you use synced scan
              history and saved PDF reports. If you choose Google sign-in,
              Google shares account details such as your name and email for
              authentication; SecScan does not receive your Google password.
            </p>
            <Link
              href="/privacy"
              className="mt-3 inline-block font-medium text-violet-300 underline underline-offset-4 hover:text-violet-200"
            >
              Read the SecScan Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="mt-2 block font-medium text-violet-300 underline underline-offset-4 hover:text-violet-200"
            >
              Read the Terms of Service
            </Link>
          </details>
        </section>
      </div>

      <div key={result?.id ?? "empty"} className="w-full">
        <ScanResult result={result} />
        {result && <ScanFindings findings={result.findings} />}
        <ScoreHistory />
      </div>
    </div>
  );
}
