"use client";

import { useState } from "react";
import type { ScanResult, Severity } from "@/types";

const severityColors: Record<Severity, [number, number, number]> = {
  high: [210, 62, 67],
  medium: [201, 128, 35],
  low: [48, 112, 190],
  pass: [30, 137, 97],
  info: [100, 108, 125],
} as const;

function pdfSafe(value: string) {
  return value
    .replace(/[→➜]/g, "->")
    .replace(/[·•]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "");
}

export default function ExportPdfButton({ result }: { result: ScanResult }) {
  const [isExporting, setIsExporting] = useState(false);

  async function exportPdf() {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ format: "a4", unit: "pt" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 44;
      const contentWidth = pageWidth - margin * 2;
      let y = 54;

      const ensureSpace = (height: number) => {
        if (y + height > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const addParagraph = (value: string, options?: { fontSize?: number; color?: [number, number, number]; left?: number; lineHeight?: number }) => {
        const fontSize = options?.fontSize ?? 10;
        const lineHeight = options?.lineHeight ?? fontSize * 1.45;
        const left = options?.left ?? margin;
        pdf.setFontSize(fontSize);
        const color = options?.color ?? [52, 59, 74];
        pdf.setTextColor(color[0], color[1], color[2]);
        const lines = pdf.splitTextToSize(pdfSafe(value), contentWidth - (left - margin));
        ensureSpace(lines.length * lineHeight + 4);
        pdf.text(lines, left, y);
        y += lines.length * lineHeight + 4;
      };

      pdf.setFillColor(31, 12, 59);
      pdf.rect(0, 0, pageWidth, 12, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(31, 12, 59);
      pdf.text("SecScan Security Report", margin, y);
      y += 28;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(70, 46, 110);
      pdf.text(pdfSafe(result.url), margin, y);
      y += 19;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 108, 125);
      pdf.text(`Scanned: ${pdfSafe(new Date(result.scannedAt).toLocaleString())}`, margin, y);
      y += 18;

      pdf.setFillColor(245, 242, 250);
      pdf.roundedRect(margin, y, contentWidth, 62, 8, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(124, 58, 237);
      pdf.text(`${result.grade}  ${result.score}/100`, margin + 14, y + 28);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(81, 85, 98);
      pdf.text("Security score", margin + 14, y + 46);
      pdf.setFontSize(8);
      let countX = margin + 190;
      for (const severity of ["high", "medium", "low", "pass", "info"] as const) {
        const count = result.findings.filter((finding) => finding.severity === severity).length;
        pdf.setTextColor(...severityColors[severity]);
        pdf.text(`${severity.toUpperCase()} ${count}`, countX, y + 34);
        countX += severity === "medium" ? 66 : 58;
      }
      y += 80;

      if (result.redirectChain && result.redirectChain.length > 1) {
        addParagraph(`Redirect path: ${result.redirectChain.join(" -> ")}`, { fontSize: 9, color: [100, 108, 125] });
        y += 4;
      }

      pdf.setDrawColor(226, 221, 235);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(31, 12, 59);
      pdf.text("Findings", margin, y);
      y += 22;

      for (const finding of result.findings) {
        const titleLines = pdf.splitTextToSize(pdfSafe(finding.title), contentWidth - 95);
        const descriptionLines = pdf.splitTextToSize(pdfSafe(finding.description), contentWidth);
        const fixLines = finding.fix ? pdf.splitTextToSize(`Recommended fix: ${pdfSafe(finding.fix)}`, contentWidth) : [];
        const blockHeight = titleLines.length * 14 + descriptionLines.length * 13 + fixLines.length * 13 + 24;
        ensureSpace(Math.min(blockHeight, pageHeight - margin * 2));

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(38, 42, 54);
        pdf.text(titleLines, margin, y);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...severityColors[finding.severity]);
        pdf.text(finding.severity.toUpperCase(), pageWidth - margin, y, { align: "right" });
        y += titleLines.length * 13 + 3;

        addParagraph(finding.description, { fontSize: 9, lineHeight: 12 });
        if (finding.fix) {
          addParagraph(`Recommended fix: ${finding.fix}`, { fontSize: 8, color: [87, 67, 125], left: margin + 8, lineHeight: 11 });
        }
        y += 8;
        ensureSpace(20);
        pdf.setDrawColor(232, 229, 238);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 14;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(135, 139, 151);
        pdf.text("Generated by SecScan", margin, pageHeight - 22);
        pdf.text(`${page} / ${totalPages}`, pageWidth - margin, pageHeight - 22, { align: "right" });
      }

      const safeDomain = result.url.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
      const date = new Date(result.scannedAt).toISOString().slice(0, 10);
      pdf.save(`secscan-${safeDomain}-${date}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      disabled={isExporting}
      className="min-h-10 shrink-0 rounded-lg border border-violet-400/30 px-3 py-2 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/15 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
    >
      {isExporting ? "Preparing PDF..." : "Download PDF"}
    </button>
  );
}
