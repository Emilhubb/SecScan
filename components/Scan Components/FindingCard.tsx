// components/FindingCard.tsx
import type { Finding, Severity } from "@/types";

const badge: Record<Severity, string> = {
  high: "text-[#f0615a] border-[#f0615a]",
  medium: "text-[#f0a23a] border-[#f0a23a]",
  low: "text-[#4d9bff] border-[#4d9bff]",
  pass: "text-[#2fb985] border-[#2fb985]",
};


const FindingCard = ({ finding }: { finding: Finding }) => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#3a1d66] bg-gradient-to-br from-[#16022b] to-[#050818] p-6">
      <div className="flex items-center justify-between gap-2">
        <b className="text-[15px]">{finding.title}</b>
        <span
          className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${badge[finding.severity]}`}
        >
          {finding.severity}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-[#8f9bbd]">
        {finding.description}
      </p>
      {finding.fix && (
        <pre className="scan-fix-scroll max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-[#241442] bg-[#050818] p-3 text-left font-mono text-[13px] leading-relaxed text-violet-100">
          {finding.fix}
        </pre>
      )}
    </div>
  );
};

export default FindingCard;
