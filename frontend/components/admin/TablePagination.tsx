"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Window of page numbers centred on the current page. */
function pageWindow(page: number, totalPages: number, size = 5) {
  const count = Math.min(size, totalPages);
  const start = Math.min(
    Math.max(1, page - Math.floor(count / 2)),
    Math.max(1, totalPages - count + 1),
  );
  return Array.from({ length: count }, (_, i) => start + i);
}

/**
 * Footer row for the admin tables: a precise range summary plus a windowed
 * pager.
 *
 * Every admin table rendered `Array.from({ length: totalPages })` — one button
 * per page — so a catalogue with 40 pages produced 40 buttons that overflowed
 * the card. They also all said "Showing 10 of 240" without saying *which* 10.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  rowsOnPage,
  onPageChange,
  noun = "results",
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rowsOnPage: number;
  onPageChange: (page: number) => void;
  /** Plural noun for the summary, e.g. "products". */
  noun?: string;
}) {
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = (page - 1) * pageSize + rowsOnPage;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-subtle">
        Showing{" "}
        <span className="font-medium text-foreground tabular-nums">
          {firstRow}–{lastRow}
        </span>{" "}
        of <span className="font-medium text-foreground tabular-nums">{total}</span> {noun}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft />
          </Button>

          {pageWindow(page, totalPages).map((pageNum) => (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="icon-sm"
              aria-label={`Page ${pageNum}`}
              aria-current={page === pageNum ? "page" : undefined}
              className="tabular-nums"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
