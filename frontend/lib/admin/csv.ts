/**
 * CSV export shared by the admin screens.
 *
 * The products page had this inline; the dashboard's own "Export Data" button
 * had no handler at all and simply did nothing when clicked.
 */

/** Escapes a cell for CSV: wrap in quotes, double any internal quote. */
function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Builds a CSV blob from a header row plus body rows and downloads it. */
export function downloadCsv(filename: string, header: string[], rows: string[][]): void {
  const csv = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");

  // The BOM makes Excel read UTF-8 correctly — without it, "€" arrives mangled.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
