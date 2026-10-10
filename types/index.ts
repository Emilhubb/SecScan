export type Severity = "high" | "medium" | "low" | "pass" | "info";

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
  redirectChain?: string[];
  scannedAt: string;
  durationMs: number;
  score: number;
  grade: "+A" | "A" | "B" | "C" | "D" | "F";
  findings: Finding[];
}
