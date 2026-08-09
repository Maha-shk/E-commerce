"use client";

import { useState } from "react";
import { BadgePercent, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicService } from "@/lib/api/services/public";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type AppliedCoupon = {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
};

/**
 * Promo code entry for the checkout summary.
 *
 * There was no way to enter a code anywhere on the storefront, despite the
 * admin being able to create campaigns. Only the CODE is ever sent with the
 * order — the server re-validates it and computes the reduction itself, so the
 * figure shown here is a preview, not the authority.
 */
export function CouponField({
  applied,
  onApply,
  onRemove,
  disabled,
}: {
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setIsChecking(true);
    setError(null);
    try {
      const result = await publicService.validateDiscount(trimmed);
      if (!result.valid) {
        setError(result.reason ?? "That code is not valid");
        return;
      }
      onApply({ code: result.code, type: result.type, value: result.value });
      setCode("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsChecking(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-success/40 bg-success-muted px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <Check className="size-4 shrink-0 text-success" aria-hidden />
          <span className="truncate font-medium text-success">{applied.code}</span>
          <span className="shrink-0 text-xs text-success/80">
            {applied.type === "PERCENTAGE"
              ? `${applied.value}% off`
              : `€${applied.value} off`}
          </span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove promo code ${applied.code}`}
          className="shrink-0 rounded-md p-1 text-success/80 transition-colors hover:bg-success/10 hover:text-success"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="promo-code"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <BadgePercent className="size-4" aria-hidden />
        Promo code
      </label>

      <div className="flex gap-2">
        <Input
          id="promo-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            // The summary sits inside the checkout form; Enter here must apply
            // the code, not submit the order.
            if (e.key === "Enter") {
              e.preventDefault();
              void check();
            }
          }}
          placeholder="e.g. SUMMER24"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          className={cn("h-10 font-mono", error && "border-destructive")}
          disabled={disabled || isChecking}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0"
          onClick={check}
          disabled={disabled || isChecking || !code.trim()}
        >
          {isChecking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Apply
        </Button>
      </div>

      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
