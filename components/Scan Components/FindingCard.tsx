// components/FindingCard.tsx
import type { Finding, Severity } from "@/types";

const badge: Record<Severity, string> = {
  high: "text-[#f0615a] border-[#f0615a]",
  medium: "text-[#f0a23a] border-[#f0a23a]",
  low: "text-[#4d9bff] border-[#4d9bff]",
  pass: "text-[#2fb985] border-[#2fb985]",
  info: "text-slate-300 border-slate-400",
};


const FindingCard = ({ finding }: { finding: Finding }) => {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#3a1d66] bg-gradient-to-br from-[#16022b] to-[#050818] p-4 sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <b className="min-w-0 flex-1 break-words text-[15px]">{finding.title}</b>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase sm:text-xs ${badge[finding.severity]}`}
        >
          {finding.severity}
        </span>
      </div>
      {finding.description.length > 240 ? (
        <div className="scan-fix-scroll max-h-40 min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg border border-[#241442] bg-[#050818] p-3 text-sm leading-relaxed text-[#aeb8d2]">
          {finding.description}
        </div>
      ) : (
        <p className="min-w-0 break-words text-sm leading-relaxed text-[#8f9bbd]">
          {finding.description}
        </p>
      )}
      {finding.fix && (
        <pre className="scan-fix-scroll max-h-64 min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg border border-[#241442] bg-[#050818] p-3 text-left font-mono text-xs leading-relaxed text-violet-100 sm:text-[13px]">
          {finding.fix}
        </pre>
      )}
    </div>
  );
};

export default FindingCard;
