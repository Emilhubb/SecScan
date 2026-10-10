export type Severity = "high" | "medium" | "low" | "pass";

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  fix?: string;
}

export interface ScanResult {
  id: string;
  url: string;
  scannedAt: string;
  durationMs: number;
  score: number;
  grade: "+A" | "A" | "B" | "C" | "D" | "F";
  findings: Finding[];
}
