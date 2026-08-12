"use client";

import { useState } from "react";
import { Loader2, MoveRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CatalogPicker } from "@/components/admin/catalog/CatalogPicker";
import { useReassignProducts } from "@/lib/hooks/use-admin";
import { REASSIGN_MAX_IDS } from "@/lib/api/services/admin";
import { getApiErrorMessage } from "@/lib/api/client";

/**
 * Moves the selected products to another Model.
 *
 * This is the unblock for a catalog node that refuses to delete: products are
 * never cascaded away, so the only alternative to deleting them one by one is
 * re-filing them somewhere else.
 *
 * The move is all-or-nothing on the server — a 200 means every id moved, and a
 * missing id rolls the whole thing back and names the offenders — so the
 * failure is shown in place rather than as a toast the admin has to reconcile
 * against a selection they can no longer see.
 */
export function MoveProductsDialog({
  open,
  onClose,
  productIds,
  onMoved,
}: {
  open: boolean;
  onClose: () => void;
  productIds: string[];
  /** Called after a successful move, to clear the selection. */
  onMoved: () => void;
}) {
  const [modelId, setModelId] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const reassign = useReassignProducts();

  const count = productIds.length;
  const overCap = count > REASSIGN_MAX_IDS;

  function submit() {
    setFailure(null);
    reassign.mutate(
      { productIds, modelId },
      {
        onSuccess: () => {
          onMoved();
          onClose();
        },
        onError: (error) => setFailure(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-left">
          <DialogTitle>
            Move {count} product{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Choose where they should sit. Everything above the model — the
            product type, brand and category — follows from it.
          </DialogDescription>
        </DialogHeader>

        {overCap ? (
          <p className="rounded-lg bg-warning-muted px-3 py-2.5 text-sm text-warning">
            {count.toLocaleString()} is more than the {REASSIGN_MAX_IDS} a single
            move allows. Deselect some and repeat.
          </p>
        ) : (
          <CatalogPicker value={modelId} onChange={setModelId} disabled={reassign.isPending} />
        )}

        {failure ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {failure}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="xl"
            onClick={onClose}
            disabled={reassign.isPending}
          >
            Cancel
          </Button>
          <Button
            size="xl"
            disabled={!modelId || overCap || reassign.isPending}
            onClick={submit}
          >
            {reassign.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <MoveRight className="size-4" aria-hidden />
            )}
            {reassign.isPending ? "Moving…" : "Move here"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
