"use client";

import { useEffect, useState } from "react";
import type { ScanResult } from "@/types";

const HISTORY_KEY = "secscan-history";
const CHART_WIDTH = 900;
const CHART_TOP = 24;
const CHART_BOTTOM = 235;
const CHART_LEFT = 64;
const CHART_RIGHT = 876;
const SCORE_LEVELS = [100, 75, 50, 25, 0];

function scoreY(score: number) {
  return CHART_BOTTOM - (score / 100) * (CHART_BOTTOM - CHART_TOP);
}

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

function wrapWebsite(value: string) {
  const website = value.replace(/^www\./i, "");
  const chunks = website.match(/.{1,16}/g) ?? [website];
  if (chunks.length <= 3) return chunks;
  return [chunks[0], chunks[1], `${chunks[2].slice(0, 15)}…`];
}

export default function ScoreHistory() {
  const [scans, setScans] = useState<ScanResult[]>([]);

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

  const points = scans.map((scan, index) => {
    const x = scans.length === 1
      ? CHART_WIDTH / 2
      : CHART_LEFT + (index / (scans.length - 1)) * (CHART_RIGHT - CHART_LEFT);
    const y = scoreY(Math.max(0, Math.min(100, scan.score)));
    return { x, y, scan };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section
      aria-labelledby="score-history-title"
      className="mx-5 mb-6 my-15 flex min-h-[700px] flex-col rounded-2xl border border-violet-500/40 bg-gradient-to-br from-[#10051f] to-[#050818] px-5 pb-5 pt-4 sm:px-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="score-history-title" className="font-mono text-2xl font-bold text-white">
          Score history
        </h2>
        <span className="font-mono text-xs text-violet-300">
          Last {scans.length} {scans.length === 1 ? "scan" : "scans"}
        </span>
      </div>

      <div className="mt-3 w-full flex-1">
        <svg
          aria-label={scans.length ? `Security score history for the last ${scans.length} scans` : "No score history yet"}
          className="block h-72 -mx-5 my-15 w-full overflow-visible sm:h-80"
          role="img"
          viewBox={`0 0 ${CHART_WIDTH} 200`}
          preserveAspectRatio="none"
        >
          <line x1={CHART_LEFT} x2={CHART_LEFT} y1={CHART_TOP} y2={CHART_BOTTOM} stroke="#4c3568" strokeWidth="1.5" />
          {SCORE_LEVELS.map((score) => {
            const y = scoreY(score);
            return (
              <g key={score}>
                <line x1={CHART_LEFT} x2={CHART_WIDTH} y1={y} y2={y} stroke="#24143b" strokeWidth="1.5" />
                <text x={CHART_LEFT - 12} y={y + 4} textAnchor="end" fill="#8b7ba8" fontSize="11" fontFamily="monospace">
                  {score}
                </text>
              </g>
            );
          })}
          {points.length > 1 && (
            <polyline
              points={line}
              fill="none"
              stroke="#a855f7"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {points.map(({ x, y, scan }) => (
            <circle key={scan.id} cx={x} cy={y} r="6.5" fill="#a855f7">
              <title>{`${scan.score}/100 · ${scan.url}`}</title>
            </circle>
          ))}
          {scans.length === 0 && (
            <text x={CHART_WIDTH / 2} y="130" textAnchor="middle" fill="#64748b" fontSize="14">
              Run scans to see your score history
            </text>
          )}
          {points.map(({ x, scan }) => (
            <text
              key={`${scan.id}-website`}
              x={x}
              y="300"
              textAnchor="middle"
              fill="#8b7ba8"
              fontSize="11"
              fontFamily="monospace"
            >
              {wrapWebsite(scan.url).map((line, index) => (
                <tspan key={`${scan.id}-${index}`} x={x} dy={index === 0 ? 0 : 14}>
                  {line}
                </tspan>
              ))}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
