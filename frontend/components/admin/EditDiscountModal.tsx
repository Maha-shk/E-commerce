"use client";

import { useState, useEffect } from "react";
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
import { NativeSelect } from "@/components/ui/select-native";
import { toast } from "sonner";
import { discountTypeLabel, type Discount, type DiscountType, type DiscountCategory } from "@/lib/api/models";

type EditDiscountModalProps = {
  /** Truthy when the modal is open. Pass a Discount to edit, or `"new"` to add. */
  target: Discount | "new" | null;
  onClose: () => void;
  onCreate?: (body: unknown) => void;
  onUpdate?: ({ id, body }: { id: string; body: unknown }) => void;
};

export function EditDiscountModal({ target, onClose, onCreate, onUpdate }: EditDiscountModalProps) {
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
            onCreate={onCreate}
            onUpdate={onUpdate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* Shared field styles — matches the filled inputs used across admin forms. */
const fieldClass = "h-11 rounded-lg bg-muted/40";
const labelClass = "text-sm font-medium text-muted-foreground";

const discountTypeOptions: { value: DiscountType; label: string }[] = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED_AMOUNT", label: "Fixed Amount" },
];

function DiscountForm({
  discount,
  onClose,
  onCreate,
  onUpdate,
}: {
  discount?: Discount;
  onClose: () => void;
  onCreate?: (body: unknown) => void;
  onUpdate?: ({ id, body }: { id: string; body: unknown }) => void;
}) {
  const [name, setName] = useState(discount?.name ?? "");
  const [code, setCode] = useState(discount?.code ?? "");
  const [type, setType] = useState<DiscountType>(discount?.type ?? "PERCENTAGE");
  const [value, setValue] = useState(String(discount?.value ?? ""));
  const [usageLimit, setUsageLimit] = useState(String(discount?.usageLimit ?? 100));
  const [startDate, setStartDate] = useState(discount?.startDate ?? "");
  const [endDate, setEndDate] = useState(discount?.endDate ?? "");

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    const body = {
      name,
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      usageLimit: parseInt(usageLimit, 10),
      startDate,
      endDate,
    };

    if (discount && onUpdate) {
      onUpdate({ id: discount.id, body });
      toast.success("Discount updated successfully");
    } else if (onCreate) {
      onCreate(body);
      toast.success("Discount created successfully");
    }
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle>{discount ? "Edit Discount" : "Create Discount"}</DialogTitle>
        <DialogDescription>
          {discount
            ? "Update discount details and restrictions."
            : "Configure a new promotional discount campaign."}
        </DialogDescription>
      </DialogHeader>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="discount-name" className={labelClass}>
          Discount Name
        </label>
        <Input
          id="discount-name"
          className={fieldClass}
          placeholder="e.g., Summer Sale 2024"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Code + Type */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="discount-code" className={labelClass}>
            Promo Code
          </label>
          <Input
            id="discount-code"
            className={fieldClass}
            placeholder="SUMMER2024"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="discount-type" className={labelClass}>
            Discount Type
          </label>
          <NativeSelect
            id="discount-type"
            className={fieldClass}
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType)}
          >
            {discountTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <label htmlFor="discount-value" className={labelClass}>
          {type === "PERCENTAGE" ? "Discount Percentage" : "Discount Amount"}
        </label>
        <div className="relative">
          <Input
            id="discount-value"
            type="number"
            min={0}
            max={type === "PERCENTAGE" ? 100 : undefined}
            step={type === "PERCENTAGE" ? 1 : 0.01}
            className={fieldClass}
            placeholder={type === "PERCENTAGE" ? "e.g., 15" : "e.g., 10.00"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-subtle">
            {type === "PERCENTAGE" ? "%" : "€"}
          </span>
        </div>
      </div>

      {/* Usage Limit */}
      <div className="space-y-2">
        <label htmlFor="usage-limit" className={labelClass}>
          Usage Limit
        </label>
        <Input
          id="usage-limit"
          type="number"
          min={1}
          className={fieldClass}
          placeholder="Maximum number of uses"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          required
        />
      </div>

      {/* Validity Period */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          id="start-date"
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
        />
        <DateField
          id="end-date"
          label="End Date"
          value={endDate}
          onChange={setEndDate}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="hidden sm:block" />
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" size="xl" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="xl">
            {discount ? "Save Changes" : "Create Discount"}
          </Button>
        </div>
      </div>
    </form>
  );
}
