"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { ScanResult } from "@/types";

const HISTORY_KEY = "secscan-history";
const PAGE_SIZE = 10;
const EMPTY_HISTORY: ScanResult[] = [];
let cachedStorageValue: string | null | undefined;
let cachedHistory: ScanResult[] = EMPTY_HISTORY;

function getServerHistory(): ScanResult[] {
  return EMPTY_HISTORY;
}

export default function HistoryPage() {
  const history = useSyncExternalStore(subscribe, getHistory, getServerHistory);
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(history.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleHistory = history.slice(pageStart, pageStart + PAGE_SIZE);

  function clearHistory() {
    setPage(1);
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event("secscan-history-change"));
  }

  return (
    <section className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 px-3 py-6 text-white sm:gap-6 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Scan history</h1>
        {history.length > 0 && <button type="button" onClick={clearHistory} className="min-h-10 rounded-md px-2 text-sm text-violet-300 underline underline-offset-4">Clear history</button>}
      </div>
      {history.length === 0 ? (
        <p className="text-slate-400">No saved scans yet. <Link className="text-violet-300 underline" href="/">Run a scan</Link>.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleHistory.map((result) => (
            <li key={result.id} className="flex min-w-0 flex-col items-start justify-between gap-2 rounded-xl border border-violet-400/20 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
              <div className="min-w-0">
                <p className="break-all font-bold">{result.url}</p>
                <time className="text-xs text-slate-400 sm:text-sm" dateTime={result.scannedAt}>{new Date(result.scannedAt).toLocaleString()}</time>
              </div>
              <p className="font-bold text-violet-200">{result.score}/100 · {result.grade}</p>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 && (
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400 sm:text-sm" aria-live="polite">
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, history.length)} of {history.length} scans
          </p>
          <nav aria-label="Scan history pages" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="min-h-10 rounded-lg border border-violet-400/20 px-3 text-sm text-slate-200 transition-colors hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-label={`Page ${pageNumber}`}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm transition-colors ${currentPage === pageNumber ? "border-violet-400 bg-violet-500/20 text-white" : "border-violet-400/20 text-slate-300 hover:bg-violet-500/15"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              className="min-h-10 rounded-lg border border-violet-400/20 px-3 text-sm text-slate-200 transition-colors hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        </div>
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
