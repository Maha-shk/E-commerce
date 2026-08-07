"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { SectionCard } from "@/components/account/SectionCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useAddresses,
  useDeleteAddress,
  useSaveAddress,
  useSetDefaultAddress,
  type Address,
} from "@/lib/hooks/use-account";
import { normaliseAddressLines } from "@/lib/address";
import { cn } from "@/lib/utils";

/**
 * Addresses are stored as a positional `lines` array:
 * [street, apartment, city, state, postcode]. See lib/address.ts.
 */
const EMPTY_FORM = {
  label: "",
  lines: ["", "", "", "", ""] as string[],
  isDefault: false,
};

type FormState = typeof EMPTY_FORM;

function iconForLabel(label: string | null) {
  const value = label?.toLowerCase() ?? "";
  if (value.includes("home") || value.includes("house")) return Home;
  if (value.includes("office") || value.includes("work") || value.includes("business")) {
    return Building2;
  }
  return MapPin;
}

export default function AddressesPage() {
  const { data: addresses = [], isPending } = useAddresses();
  const saveAddress = useSaveAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

  const isFormOpen = form !== null;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, lines: [...EMPTY_FORM.lines] });
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label ?? "",
      lines: normaliseAddressLines(address.lines),
      isDefault: address.isDefault,
    });
  };

  const closeForm = () => {
    setForm(null);
    setEditingId(null);
  };

  const setLine = (index: number, value: string) =>
    setForm((current) => {
      if (!current) return current;
      const lines = [...current.lines];
      lines[index] = value;
      return { ...current, lines };
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const [street, , city, , postcode] = form.lines;
    if (!street?.trim() || !city?.trim() || !postcode?.trim()) {
      toast.error("Street address, city and postal code are required");
      return;
    }

    saveAddress.mutate(
      {
        id: editingId ?? undefined,
        dto: {
          label: form.label.trim() || undefined,
          // All five slots are kept so positions stay stable on the server.
          lines: form.lines.map((line) => line.trim()),
          isDefault: form.isDefault,
        },
      },
      { onSuccess: closeForm },
    );
  };

  return (
    <AccountShell loadingLabel="Loading your addresses…">
      <AccountPageHeader
        title="Address Book"
        description="Manage the destinations you ship to."
        action={
          <Button size="lg" onClick={openCreate} disabled={isFormOpen}>
            <Plus className="size-4" aria-hidden />
            Add New Address
          </Button>
        }
      />

      {/* Add / edit form */}
      {form ? (
        <SectionCard
          divided
          className="ring-2 ring-primary/60"
          title={editingId ? "Edit Address" : "Add New Address"}
          action={
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={closeForm}
              aria-label="Close address form"
            >
              <X className="size-4" aria-hidden />
            </Button>
          }
          bodyClassName="px-5 pt-5 pb-5"
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              id="address-label"
              label="Label (optional)"
              placeholder="Home, Office, Mum's house…"
              autoComplete="off"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />

            <Field
              id="address-street"
              label="Street address"
              placeholder="123 Main Street"
              autoComplete="address-line1"
              required
              value={form.lines[0]}
              onChange={(e) => setLine(0, e.target.value)}
            />

            <Field
              id="address-apartment"
              label="Apartment, suite (optional)"
              placeholder="Apt 4B"
              autoComplete="address-line2"
              value={form.lines[1]}
              onChange={(e) => setLine(1, e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                id="address-city"
                label="City"
                placeholder="Dublin"
                autoComplete="address-level2"
                required
                value={form.lines[2]}
                onChange={(e) => setLine(2, e.target.value)}
              />
              <Field
                id="address-state"
                label="State / County"
                placeholder="Leinster"
                autoComplete="address-level1"
                value={form.lines[3]}
                onChange={(e) => setLine(3, e.target.value)}
              />
            </div>

            <Field
              id="address-postcode"
              label="Postal code"
              placeholder="D02 XY45"
              autoComplete="postal-code"
              required
              wrapperClassName="md:max-w-xs"
              value={form.lines[4]}
              onChange={(e) => setLine(4, e.target.value)}
            />

            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="address-default"
                checked={form.isDefault}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isDefault: checked === true })
                }
              />
              <Label htmlFor="address-default" className="text-sm font-normal">
                Set as my default shipping address
              </Label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" size="lg" disabled={saveAddress.isPending}>
                {saveAddress.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {editingId ? "Update Address" : "Add Address"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={closeForm}
                disabled={saveAddress.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      {/* List */}
      {isPending ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading addresses…</p>
        </div>
      ) : addresses.length === 0 ? (
        <AccountEmptyState
          bordered
          icon={MapPin}
          title="No addresses yet"
          description="Save an address once and checkout gets a lot faster."
          action={
            <Button size="lg" onClick={openCreate} disabled={isFormOpen}>
              <Plus className="size-4" aria-hidden />
              Add Your First Address
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {addresses.map((address) => {
            const Icon = iconForLabel(address.label);
            const isBusy =
              setDefaultAddress.isPending && setDefaultAddress.variables === address.id;

            return (
              <Card
                key={address.id}
                className={cn(
                  "gap-0 py-0 transition-shadow duration-150 hover:shadow-card-hover",
                  address.isDefault && "ring-2 ring-primary",
                )}
              >
                <div className="flex flex-1 flex-col p-5">
                  {/* Header: icon + label on the left, row actions on the right.
                      Both sit in the normal flow, so a long label can no longer
                      slide underneath the absolutely-positioned buttons. */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold tracking-tight">
                          {address.label || "Address"}
                        </h3>
                        {address.isDefault ? (
                          <Badge variant="success" className="mt-1 h-5 px-2">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEdit(address)}
                        aria-label={`Edit ${address.label || "address"}`}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setPendingDelete(address)}
                        aria-label={`Delete ${address.label || "address"}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  {/* `flex-1` lets the address block absorb the spare height so
                      the button below stays pinned to the card's bottom edge —
                      cards with 3-line and 5-line addresses still line up. */}
                  <address className="mt-4 flex-1 space-y-0.5 text-sm text-muted-foreground not-italic">
                    {address.lines.filter(Boolean).map((line, index) => (
                      <p key={`${address.id}-${index}`}>{line}</p>
                    ))}
                  </address>

                  {/* Promote to default. Hidden on the default card itself,
                      which already carries the Default badge. */}
                  {!address.isDefault ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-5 w-full"
                      disabled={setDefaultAddress.isPending}
                      onClick={() => setDefaultAddress.mutate(address.id)}
                    >
                      {isBusy ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Check className="size-3.5" aria-hidden />
                      )}
                      Set as Default
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}

          {/* Add-new tile */}
          <button
            type="button"
            onClick={openCreate}
            disabled={isFormOpen}
            className={cn(
              "flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-5 text-center",
              "transition-colors duration-150 hover:border-primary hover:bg-muted/40",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "disabled:opacity-50",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Plus className="size-6" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight">Add New Location</span>
            <span className="text-sm text-muted-foreground">
              Shipping somewhere else? Add another address.
            </span>
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this address?"
        description={
          <span>
            <span className="font-semibold text-foreground">
              {pendingDelete?.label || "This address"}
            </span>{" "}
            will be removed from your address book. This can&apos;t be undone.
          </span>
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) deleteAddress.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </AccountShell>
  );
}
