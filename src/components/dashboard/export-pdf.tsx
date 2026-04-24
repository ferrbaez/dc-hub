"use client";

import type { CsvColumn } from "@/components/dashboard/export-csv";
import { FileText, Loader2 } from "lucide-react";
import { type RefObject, useState } from "react";

/**
 * Snapshot-based PDF export. Rasterises the given DOM element with html2canvas
 * and places it into a jsPDF document, paginating across pages when needed.
 *
 * The advantage vs autotable-style PDFs: the PDF looks EXACTLY like the UI
 * view — same typography, groupings, colors, alert chips, tri-phase cells,
 * expanded/collapsed state, etc. Just whatever the user sees.
 */
type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;

/** Paint the header band at the top of the current page. Called once per page. */
function drawHeader(
  pdf: JsPdfDoc,
  title: string,
  subtitle: string | null,
  pageWidth: number,
  bandHeight: number,
  pageIndex: number,
  pageCount: number,
) {
  pdf.setFillColor(15, 23, 42); // penguin obsidian
  pdf.rect(0, 0, pageWidth, bandHeight, "F");
  pdf.setTextColor(185, 253, 59); // penguin lime
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("WILLIAN'S HUB", 32, 18);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(13);
  pdf.text(title, 32, 35);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  if (subtitle) pdf.text(subtitle, pageWidth - 32, 22, { align: "right" });
  const metaRight = `Generado ${new Date().toLocaleString("es-AR")}${pageCount > 1 ? ` · pág. ${pageIndex + 1}/${pageCount}` : ""}`;
  pdf.text(metaRight, pageWidth - 32, 34, { align: "right" });
}

export async function exportPdfSnapshot(
  filename: string,
  title: string,
  subtitle: string | null,
  element: HTMLElement,
) {
  const [{ jsPDF }, html2canvasMod] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const html2canvas = html2canvasMod.default;

  // Temporarily expand overflow to capture the full content (not just visible)
  const originalStyle = {
    overflow: element.style.overflow,
    maxHeight: element.style.maxHeight,
  };
  element.style.overflow = "visible";
  element.style.maxHeight = "none";

  try {
    // Scale 1.5 keeps text readable without bloating file size (scale 2 = 4×
    // pixels ≈ 4× file size).
    const scale = 1.5;

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ignoreElements: (el) => el instanceof HTMLElement && el.dataset.pdfHide === "true",
    });

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const bandHeight = 44;
    const topPadding = 12;
    const bottomPadding = 24;
    const contentTop = bandHeight + topPadding;
    const perPageContentHeight = pageHeight - contentTop - bottomPadding;

    const imgWidth = pageWidth - 48;
    const imgX = 24;
    const pxToPt = imgWidth / canvas.width;
    const imgHeight = canvas.height * pxToPt;
    // JPEG @ 0.82 keeps tables crisp while cutting file size ~4-6× vs PNG.
    const imgData = canvas.toDataURL("image/jpeg", 0.82);

    // Straight slicing: each page shows the next chunk of the image with no
    // overlap and no repeated column header. Nested expansion tables confuse
    // a "repeat the main thead" approach, so we keep it simple. Occasional
    // mid-row cuts at page boundaries are acceptable — cleaner than
    // double-rendered rows.
    const totalPages = Math.max(1, Math.ceil(imgHeight / perPageContentHeight));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      const imgY = contentTop - page * perPageContentHeight;
      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth, imgHeight);

      // Mask the area above contentTop to hide image overflow, then paint the
      // WILLIAN'S HUB band on top of the mask.
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, contentTop, "F");
      drawHeader(pdf, title, subtitle, pageWidth, bandHeight, page, totalPages);

      // Clean bottom margin so next page's image doesn't bleed through.
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pageHeight - bottomPadding, pageWidth, bottomPadding, "F");
    }

    pdf.save(filename);
  } finally {
    element.style.overflow = originalStyle.overflow;
    element.style.maxHeight = originalStyle.maxHeight;
  }
}

/**
 * Legacy autotable-based PDF (kept for any existing callers). New callers
 * should use ExportPdfButton which now takes a ref.
 */
export async function exportPdf<T>(
  filename: string,
  title: string,
  subtitle: string | null,
  columns: CsvColumn<T>[],
  rows: T[],
) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default ?? autoTableMod;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 50, "F");
  doc.setTextColor(185, 253, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("WILLIAN'S HUB", 32, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title, 32, 40);
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(subtitle, pageWidth - 32, 28, { align: "right" });
    doc.text(`Generado ${new Date().toLocaleString("es-AR")}`, pageWidth - 32, 40, {
      align: "right",
    });
  }

  const head = [columns.map((c) => c.header)];
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = c.get(r);
      if (v == null) return "—";
      if (typeof v === "number") {
        return v.toLocaleString("en-US", {
          maximumFractionDigits: Math.abs(v) < 100 ? 2 : 0,
        });
      }
      return String(v);
    }),
  );

  autoTable(doc, {
    head,
    body,
    startY: 64,
    margin: { left: 32, right: 32 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42], textColor: [185, 253, 59], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.column.index >= 2) data.cell.styles.halign = "right";
    },
  });

  doc.save(filename);
}

/**
 * Button that exports the referenced DOM element as a PDF snapshot — the
 * PDF reflects exactly the current UI state (sorting, filters, grouping,
 * expanded rows).
 */
export function ExportPdfButton({
  filename,
  title,
  subtitle,
  targetRef,
  disabled,
}: {
  filename: string;
  title: string;
  subtitle?: string | null;
  targetRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      await exportPdfSnapshot(filename, title, subtitle ?? null, targetRef.current);
    } catch (err) {
      console.error("[pdf] export failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-penguin-obsidian shadow-sm transition-colors hover:border-penguin-lime/60 hover:bg-penguin-lime/10 disabled:opacity-40"
      title="Exportar vista actual a PDF"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      Exportar PDF
    </button>
  );
}
