import type { ScanResult as ScanResultData } from "@/types";
import { getGrade } from "@/lib/grades";

export default function ScanResult({ result }: { result: ScanResultData | null }) {
  if (!result) return <p className="w-full px-6 text-sm text-slate-400">Submit a domain to see its scan report.</p>;

  const groups = [
    { label: "High", severity: "high", color: "text-[#f0615a]" },
    { label: "Medium", severity: "medium", color: "text-[#f0a23a]" },
    { label: "Low", severity: "low", color: "text-[#4d9bff]" },
    { label: "Pass", severity: "pass", color: "text-[#2fb985]" },
    { label: "Info", severity: "info", color: "text-slate-300" },
  ] as const;
  const grade = getGrade(result.score);

  return (
    <section aria-label="Scan summary" className="animate-result-in flex w-full flex-col gap-4 px-5 sm:flex-row">
      <div className="flex flex-2 flex-col items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-[#140125] to-slate-950 py-8 text-center shadow-lg shadow-violet-950/30 sm:px-6">
        <span className="font-bold">Security score</span>
        <p className="text-[100px] font-bold leading-tight" style={{ color: grade.color }}>{result.grade}</p>
        <p className="text-xl font-bold">{result.score} / 100</p>
        <p className="mt-2 text-sm text-slate-400">{grade.label}</p>
      </div>
      <div className="flex-5 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-[#140125] to-slate-950 py-8 text-center shadow-lg shadow-violet-950/30 sm:px-4">
        <div className="flex flex-col justify-between gap-2 px-5 text-start sm:flex-row sm:items-center">
          <p className="break-all font-bold">{result.url}</p>
          <time className="text-sm text-slate-400" dateTime={result.scannedAt}>Scanned {new Date(result.scannedAt).toLocaleString()}</time>
        </div>
        {result.redirectChain && result.redirectChain.length > 1 && (
          <p className="mt-3 break-all px-5 text-start text-sm text-slate-400">
            Redirect path: {result.redirectChain.join(" → ")}
          </p>
        )}
        <div className="mt-8 grid grid-cols-2 gap-3 px-3 sm:grid-cols-5">
          {groups.map(({ label, severity, color }) => {
            const count = result.findings.filter((item) => item.severity === severity).length;
            return <div key={severity} className="rounded-2xl bg-slate-950/70 py-6 shadow-lg shadow-violet-950/30"><p className={`text-sm font-bold ${color}`}>{label}</p><p className={`mt-3 text-4xl font-bold ${color}`}>{count}</p></div>;
          })}
        </div>
      </div>
    </section>
  );
}
