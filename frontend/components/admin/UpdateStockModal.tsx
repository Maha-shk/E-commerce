"use client";

import { useState } from "react";
import { Package, Clock, ArrowLeftRight, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/admin/inventory";

type AdjustmentType = "increase" | "decrease" | "set";

const adjustmentTypes: { key: AdjustmentType; label: string }[] = [
  { key: "increase", label: "Increase Stock" },
  { key: "decrease", label: "Decrease Stock" },
  { key: "set", label: "Set Exact Quantity" },
];

/** UI-only stock adjustment modal. Fields are placeholders — no persistence. */
export function UpdateStockModal({
  item,
  onClose,
}: {
  item: InventoryItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-0">
        {item && <UpdateStockForm key={item.id} item={item} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function UpdateStockForm({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [type, setType] = useState<AdjustmentType>("increase");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle>Update Stock</DialogTitle>
        <DialogDescription>
          Maintain precise control over your product availability and stock integrity.
        </DialogDescription>
      </DialogHeader>

      {/* Product (read-only) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Product</label>
        <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/30 p-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-accent to-muted text-primary">
            <Package className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {item.name}
          </span>
          <Badge variant="secondary" className="shrink-0 rounded-md">
            ID: {item.sku}
          </Badge>
        </div>
      </div>

      {/* Read-only stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/40 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Current Stock</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold text-foreground">
              {item.stock.toLocaleString()}
            </span>
            <span className="text-xs text-subtle">Units</span>
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Last Updated</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Clock className="size-4 text-subtle" />
            {item.lastUpdated}
          </p>
        </div>
      </div>

      {/* Adjustment type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Adjustment Type</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {adjustmentTypes.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors",
                type === t.key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <label htmlFor="stock-quantity" className="text-sm font-medium text-muted-foreground">
          Quantity
        </label>
        <Input
          id="stock-quantity"
          type="number"
          min={0}
          inputMode="numeric"
          className="h-11 rounded-lg bg-card"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="stock-notes" className="text-sm font-medium text-muted-foreground">
          Notes <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id="stock-notes"
          rows={3}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Add a reason for this adjustment (e.g. incoming shipment, damaged goods)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="xl" className="flex-1" onClick={onClose}>
          <ArrowLeftRight />
          Update Stock
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-subtle">
        <History className="size-3.5" />
        This action will be logged in the global audit trail for Cento Servizi.
      </p>
    </div>
  );
}
