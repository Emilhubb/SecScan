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
];

const ScanFindings = ({ findings }: { findings: Finding[] }) => {
  const [active, setActive] = useState<Severity | "all">("all");

  const visible =
    active === "all" ? findings : findings.filter((f) => f.severity === active);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Findings</h2>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={active === f.key}
              onClick={() => setActive(f.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="text-sm text-slate-400">No scan findings match this filter.</p>
      )}
    </section>
  );
};

export default ScanFindings;