import type { ScanResult as ScanResultData } from "@/types";
import { getGrade } from "@/lib/grades";
import ExportPdfButton from "@/components/Scan Components/ExportPdfButton";

export default function ScanResult({ result }: { result: ScanResultData | null }) {
  if (!result) return <p className="w-full px-3 text-sm text-slate-400 sm:px-5">Submit a domain to see its scan report.</p>;

  const groups = [
    { label: "High", severity: "high", color: "text-[#f0615a]" },
    { label: "Medium", severity: "medium", color: "text-[#f0a23a]" },
    { label: "Low", severity: "low", color: "text-[#4d9bff]" },
    { label: "Pass", severity: "pass", color: "text-[#2fb985]" },
    { label: "Info", severity: "info", color: "text-slate-300" },
  ] as const;
  const grade = getGrade(result.score);

  return (
    <section aria-label="Scan summary" className="animate-result-in flex w-full min-w-0 flex-col gap-3 px-0 sm:flex-row sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-[#140125] to-slate-950 py-5 text-center shadow-lg shadow-violet-950/30 sm:w-2/5 sm:py-8 sm:px-4 lg:px-6">
        <span className="font-bold">Security score</span>
        <p className={`text-7xl font-bold leading-tight sm:text-8xl lg:text-[100px] ${grade.color}`}>{result.grade}</p>
        <p className="text-xl font-bold">{result.score} / 100</p>
        <p className="mt-2 text-sm italic text-slate-400">{grade.label}</p>
      </div>
      <div className="min-w-0 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-[#140125] to-slate-950 py-5 text-center shadow-lg shadow-violet-950/30 sm:flex-1 sm:py-8 sm:px-4">
        <div className="flex min-w-0 flex-col justify-between gap-2 px-4 text-start sm:flex-row sm:items-center sm:px-2">
          <p className="break-all font-bold">{result.url}</p>
          <time className="text-xs text-slate-400 sm:text-sm" dateTime={result.scannedAt}>Scanned {new Date(result.scannedAt).toLocaleString()}</time>
        </div>
        <div className="mt-3 flex justify-start px-4 sm:justify-end sm:px-2">
          <ExportPdfButton result={result} />
        </div>
        {result.redirectChain && result.redirectChain.length > 1 && (
          <p className="mt-3 break-all px-4 text-start text-xs leading-relaxed text-slate-400 sm:px-2 sm:text-sm">
            Redirect path: {result.redirectChain.join(" → ")}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2 px-3 sm:mt-8 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {groups.map(({ label, severity, color }) => {
            const count = result.findings.filter((item) => item.severity === severity).length;
            return <div key={severity} className="rounded-xl bg-slate-950/70 py-4 shadow-lg shadow-violet-950/30 sm:rounded-2xl sm:py-6"><p className={`text-xs font-bold sm:text-sm ${color}`}>{label}</p><p className={`mt-2 text-3xl font-bold sm:mt-3 sm:text-4xl ${color}`}>{count}</p></div>;
          })}
        </div>
      </div>
    </section>
  );
}
