"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanResult } from "@/types";

const HISTORY_KEY = "secscan-history";
const CHART_TOP = 24;
const SCORE_LEVELS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

function readHistory(): ScanResult[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return (value as ScanResult[])
      .filter((item) => Number.isFinite(item.score) && Number.isFinite(Date.parse(item.scannedAt)))
      .sort((a, b) => Date.parse(a.scannedAt) - Date.parse(b.scannedAt))
      .slice(-6);
  } catch {
    return [];
  }
}

function wrapWebsite(value: string, chunkSize: number) {
  const website = value.replace(/^www\./i, "");
  const chunks = website.match(new RegExp(`.{1,${chunkSize}}`, "g")) ?? [website];
  if (chunks.length <= 3) return chunks;
  return [chunks[0], chunks[1], `${chunks[2].slice(0, chunkSize - 1)}…`];
}

export default function ScoreHistory() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const chartRef = useRef<SVGSVGElement>(null);
  const [chartSize, setChartSize] = useState({ width: 900, height: 560 });

  useEffect(() => {
    const refresh = () => setScans(readHistory());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("secscan-history-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("secscan-history-change", refresh);
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width > 0 && height > 0) setChartSize({ width, height });
    });
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);

  const chartBottom = Math.max(CHART_TOP + 80, chartSize.height - 100);
  // Keep equal horizontal breathing room on both sides at every chart width.
  const chartInset = Math.min(64, Math.max(42, chartSize.width * 0.08));
  const chartLeft = chartInset;
  const chartRight = Math.max(chartLeft + 40, chartSize.width - chartInset);
  const scoreY = (score: number) => chartBottom - (score / 100) * (chartBottom - CHART_TOP);
  const points = scans.map((scan, index) => {
    const x = scans.length === 1
      ? (chartLeft + chartRight) / 2
      : chartLeft + (index / (scans.length - 1)) * (chartRight - chartLeft);
    const y = scoreY(Math.max(0, Math.min(100, scan.score)));
    return { x, y, scan };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section
      aria-labelledby="score-history-title"
      className="mx-0 mb-5 mt-5 flex min-h-110 min-w-0 flex-col overflow-hidden rounded-2xl border border-violet-500/40 bg-linear-to-br from-[#10051f] to-[#050818] px-3 pb-4 pt-4 sm:mb-6 sm:mt-6 sm:min-h-[580px] sm:px-6 sm:pb-5 lg:min-h-[700px]"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="score-history-title" className="min-w-0 font-mono text-lg font-bold text-white sm:text-2xl">
          Score history
        </h2>
        <span className="shrink-0 font-mono text-xs text-violet-300">
          Last {scans.length} {scans.length === 1 ? "scan" : "scans"}
        </span>
      </div>

      <div className="mt-3 min-h-87.5 w-full min-w-0 flex-1 sm:min-h-117.5 lg:min-h-145">
        <svg
          ref={chartRef}
          aria-label={scans.length ? `Security score history for the last ${scans.length} scans` : "No score history yet"}
          className="block h-full min-h-87.5 w-full overflow-hidden sm:min-h-117.5 lg:min-h-145"
          role="img"
          viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
          preserveAspectRatio="none"
        >
          <line x1={chartLeft} x2={chartLeft} y1={CHART_TOP} y2={chartBottom} stroke="#4c3568" strokeWidth="1.5" />
          {SCORE_LEVELS.map((score) => {
            const y = scoreY(score);
            return (
              <g key={score}>
                <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="#24143b" strokeWidth="1.5" />
                <text x={chartLeft - 12} y={y + 4} textAnchor="end" fill="#8b7ba8" fontSize="11" fontFamily="monospace">
                  {score}
                </text>
              </g>
            );
          })}
          {points.length > 1 && (
            <polyline points={line} fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          )}
          {points.map(({ x, y, scan }) => (
            <circle key={scan.id} cx={x} cy={y} r="6.5" fill="#a855f7">
              <title>{`${scan.score}/100 · ${scan.url}`}</title>
            </circle>
          ))}
          {scans.length === 0 && (
            <text x={chartSize.width / 2} y={chartSize.height / 2} textAnchor="middle" fill="#64748b" fontSize="14">
              Run scans to see your score history
            </text>
          )}
          {points.map(({ x, scan }) => (
            <text key={`${scan.id}-website`} x={x} y={chartSize.height - 58} textAnchor="middle" fill="#8b7ba8" fontSize={chartSize.width < 400 ? "9" : "11"} fontFamily="monospace">
              {wrapWebsite(scan.url, chartSize.width < 400 ? 6 : chartSize.width < 640 ? 9 : 16).map((label, index) => (
                <tspan key={`${scan.id}-${index}`} x={x} dy={index === 0 ? 0 : 14}>
                  {label}
                </tspan>
              ))}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
