"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DateField } from "@/components/admin/DateField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/select-native";
import { discountTypes, type Discount, type DiscountType } from "@/lib/admin/discounts";

type EditDiscountModalProps = {
  /** Truthy when the modal is open. Pass a Discount to edit, or `true` to add. */
  target: Discount | "new" | null;
  onClose: () => void;
};

/** UI-only add/edit discount modal. Nothing is persisted yet. */
export function EditDiscountModal({ target, onClose }: EditDiscountModalProps) {
  const isEdit = target && target !== "new";

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-0 sm:max-w-xl sm:p-6">
        {target && (
          <DiscountForm
            key={isEdit ? target.id : "new"}
            discount={isEdit ? target : undefined}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* Shared field styles — matches the filled inputs used across admin forms. */
const fieldClass = "h-11 rounded-lg bg-muted/40";
const labelClass = "text-sm font-medium text-muted-foreground";

function DiscountForm({ discount, onClose }: { discount?: Discount; onClose: () => void }) {
  const [name, setName] = useState(discount?.name ?? "");
  const [code, setCode] = useState(discount?.code ?? "");
  const [type, setType] = useState<DiscountType>(discount?.type ?? "Percentage");
  const [value, setValue] = useState(discount ? String(discount.value) : "");
  const [usageLimit, setUsageLimit] = useState(discount ? String(discount.usageLimit) : "");
  const [startDate, setStartDate] = useState(discount?.startDate ?? "");
  const [endDate, setEndDate] = useState(discount?.endDate ?? "");
  const [active, setActive] = useState(discount ? discount.status === "Active" : true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Frontend-only for now — no backend to persist to yet.
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle>{discount ? "Edit Discount" : "Add Discount"}</DialogTitle>
        <DialogDescription>Define rules for your new promotion.</DialogDescription>
      </DialogHeader>

      {/* Discount name */}
      <div className="space-y-2">
        <label htmlFor="discount-name" className={labelClass}>
          Discount Name
        </label>
        <Input
          id="discount-name"
          className={fieldClass}
          placeholder="e.g., Seasonal Sale"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Code + type */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="discount-code" className={labelClass}>
            Discount Code
          </label>
          <Input
            id="discount-code"
            className={`${fieldClass} font-medium tracking-wide`}
            placeholder="WINTER20"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="discount-type" className={labelClass}>
            Type
          </label>
          <NativeSelect
            id="discount-type"
            className={fieldClass}
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType)}
          >
            {discountTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Value + usage limit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="discount-value" className={labelClass}>
            Value
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-subtle">
              {type === "Percentage" ? "%" : "€"}
            </span>
            <Input
              id="discount-value"
              type="number"
              inputMode="decimal"
              className={`${fieldClass} pl-8`}
              placeholder={type === "Percentage" ? "20" : "20.00"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="discount-usage" className={labelClass}>
            Usage Limit
          </label>
          <Input
            id="discount-usage"
            type="number"
            inputMode="numeric"
            className={fieldClass}
            placeholder="500"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          id="discount-start"
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
        />
        <DateField id="discount-end" label="End Date" value={endDate} onChange={setEndDate} />
      </div>

      {/* Active status */}
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-input bg-muted/30 p-3.5">
        <span>
          <span className="block text-sm font-semibold text-foreground">Active Status</span>
          <span className="block text-xs leading-relaxed text-subtle">
            Turn this discount on or off immediately.
          </span>
        </span>
        <Switch checked={active} onCheckedChange={setActive} />
      </label>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="xl" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="xl">
          Save Discount
        </Button>
      </div>
    </form>
  );
}
