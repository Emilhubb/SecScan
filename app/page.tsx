"use client";

import { useState } from "react";
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
      const previous = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as ScanResultData[];
      localStorage.setItem(HISTORY_KEY, JSON.stringify([nextResult, ...previous.filter((item) => item.url !== nextResult.url)].slice(0, 25)));
      window.dispatchEvent(new Event("secscan-history-change"));
    } catch {
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col items-center gap-6 px-4 py-5 text-white sm:px-6 lg:px-8">
      <ScanForm onComplete={saveResult} />
      <div key={result?.id ?? "empty"} className="w-full">
        <ScanResult result={result} />
        {result && <ScanFindings findings={result.findings} />}
        <ScoreHistory />
      </div>
    </div>
  );
}
