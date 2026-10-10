"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { ScanResult } from "@/types";

const HISTORY_KEY = "secscan-history";
const EMPTY_HISTORY: ScanResult[] = [];
let cachedStorageValue: string | null | undefined;
let cachedHistory: ScanResult[] = EMPTY_HISTORY;

function getServerHistory(): ScanResult[] {
  return EMPTY_HISTORY;
}

export default function HistoryPage() {
  const history = useSyncExternalStore(subscribe, getHistory, getServerHistory);

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
  const storageValue = localStorage.getItem(HISTORY_KEY);
  if (storageValue === cachedStorageValue) return cachedHistory;

  try {
    const saved: unknown = JSON.parse(storageValue ?? "[]");
    if (Array.isArray(saved)) {
      const seenUrls = new Set<string>();
      cachedHistory = (saved as ScanResult[]).filter((result) => {
        if (seenUrls.has(result.url)) return false;
        seenUrls.add(result.url);
        return true;
      });
    } else {
      cachedHistory = EMPTY_HISTORY;
    }
  } catch {
    cachedHistory = EMPTY_HISTORY;
  }

  cachedStorageValue = storageValue;
  return cachedHistory;
}
