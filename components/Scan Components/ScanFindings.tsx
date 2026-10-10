"use client";

import { useState } from "react";
import type { Finding, Severity } from "@/types";
import FindingCard from "./FindingCard";

const filters: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "pass", label: "Pass" },
  { key: "info", label: "Info" },
];

const ScanFindings = ({ findings }: { findings: Finding[] }) => {
  const [active, setActive] = useState<Severity | "all">("all");

  const visible =
    active === "all" ? findings : findings.filter((f) => f.severity === active);

  return (
    <section aria-labelledby="scan-findings-title" className="animate-result-in flex w-full min-w-0 flex-col gap-4 px-0 py-4 sm:px-5 sm:py-5">
      <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <h2 id="scan-findings-title" className="text-xl font-bold sm:text-2xl">Findings</h2>
        <div role="group" aria-label="Filter findings by severity" className="scan-fix-scroll flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={active === f.key}
              onClick={() => setActive(f.key)}
              className={`min-h-10 shrink-0 rounded-full border px-3 py-2 text-xs transition-colors sm:px-3.5 sm:text-sm ${
                active === f.key
                  ? "border-[#9b5cf6] bg-[#1d1245] text-white"
                  : "border-[#3a1d66] text-[#9aa3b8]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid w-full min-w-0 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      ) : (
        <p className="w-full py-6 text-center text-sm text-slate-400">
          No findings match this filter.
        </p>
      )}
    </section>
  );
};

export default ScanFindings;
