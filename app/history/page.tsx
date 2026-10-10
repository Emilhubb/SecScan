"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { ScanResult } from "@/types";

const HISTORY_KEY = "secscan-history";

export default function HistoryPage() {
  const history = useSyncExternalStore(subscribe, getHistory, () => []);

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event("secscan-history-change"));
  }

  return (
    <section className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-6 py-10 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Scan history</h1>
        {history.length > 0 && <button type="button" onClick={clearHistory} className="text-sm text-violet-300 underline">Clear history</button>}
      </div>
      {history.length === 0 ? (
        <p className="text-slate-400">No saved scans yet. <Link className="text-violet-300 underline" href="/">Run a scan</Link>.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {history.map((result) => (
            <li key={result.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-400/20 bg-slate-900/60 p-4">
              <div>
                <p className="break-all font-bold">{result.url}</p>
                <time className="text-sm text-slate-400" dateTime={result.scannedAt}>{new Date(result.scannedAt).toLocaleString()}</time>
              </div>
              <p className="font-bold text-violet-200">{result.score}/100 · {result.grade}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("secscan-history-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("secscan-history-change", onChange);
  };
}

function getHistory(): ScanResult[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(saved) ? (saved as ScanResult[]) : [];
  } catch {
    return [];
  }
}
