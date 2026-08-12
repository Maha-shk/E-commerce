"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/admin/QueryState";
import { useCatalogList, useReorderCatalogNodes } from "@/lib/hooks/use-catalog";
import type { CatalogLevelSpec, CatalogNode } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

/** The API caps a page at 100, and reorder must send every sibling. */
const MAX_SIBLINGS = 100;

/**
 * Sets the order of one level's siblings.
 *
 * This is not cosmetic: the storefront menu is ordered by `position`, so
 * without it an admin cannot control what shoppers see first.
 *
 * Two things shape the design. `reorder` takes the complete sibling list and
 * assigns positions by array index, so a partial list would collide with the
 * rows it omitted — which is why this fetches all siblings in one page rather
 * than reordering whatever the table happened to be showing. And moves are
 * buttons rather than drag-and-drop: it needs to work from the keyboard, and a
 * drag library is a lot of weight for a list of this size.
 */
export function ReorderNodesDialog({
  open,
  onClose,
  level,
  /** The parent whose children are being ordered. Omit for categories. */
  parentId,
  parentName,
}: {
  open: boolean;
  onClose: () => void;
  level: CatalogLevelSpec;
  parentId?: string;
  parentName?: string;
}) {
  const { data, isPending } = useCatalogList(
    level.segment,
    {
      parentId,
      limit: MAX_SIBLINGS,
      // Reordering a list sorted by anything else would be meaningless.
      sortBy: "position",
      sortOrder: "asc",
      withCounts: false,
    },
    { enabled: open },
  );

  const rows = data?.data;
  const total = data?.meta.total ?? 0;
  const tooMany = total > MAX_SIBLINGS;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] gap-0 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>Order {level.labelPlural.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {parentName
              ? `Inside ${parentName}. `
              : ""}
            This is the order shoppers see in the storefront menu.
          </DialogDescription>
        </DialogHeader>

        {isPending || !rows ? (
          <LoadingState label="Loading siblings…" />
        ) : tooMany ? (
          <>
            <p className="my-4 rounded-lg bg-warning-muted px-3 py-2.5 text-sm text-warning">
              There are {total.toLocaleString()} {level.labelPlural.toLowerCase()}{" "}
              here. Ordering works on up to {MAX_SIBLINGS} at a time, because the
              whole list has to be saved together — set positions individually
              instead.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="xl" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <ReorderList
            // Seeds from the loaded order via useState rather than an effect;
            // a fresh fetch remounts and re-seeds.
            key={rows.map((node) => node.id).join("/")}
            level={level}
            initial={rows}
            parentId={parentId}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReorderList({
  level,
  initial,
  parentId,
  onClose,
}: {
  level: CatalogLevelSpec;
  initial: CatalogNode[];
  parentId?: string;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<CatalogNode[]>(initial);
  const reorder = useReorderCatalogNodes(level.segment);

  const dirty = order.some((node, index) => initial[index]?.id !== node.id);

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      const [lifted] = next.splice(from, 1);
      next.splice(to, 0, lifted);
      return next;
    });
  }

  if (order.length === 0) {
    return (
      <>
        <p className="my-4 text-sm text-muted-foreground">Nothing to order yet.</p>
        <div className="flex justify-end">
          <Button variant="outline" size="xl" onClick={onClose}>
            Close
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <ol className="my-4 max-h-[46dvh] space-y-1 overflow-y-auto pr-1">
        {order.map((node, index) => (
          <li
            key={node.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2",
              node.id !== initial[index]?.id && "border-primary/40 bg-accent/40",
            )}
          >
            <GripVertical className="size-4 shrink-0 text-subtle" aria-hidden />
            <span className="w-6 shrink-0 text-xs text-subtle tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {node.name}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={index === 0}
              aria-label={`Move ${node.name} up`}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={index === order.length - 1}
              aria-label={`Move ${node.name} down`}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown />
            </Button>
          </li>
        ))}
      </ol>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          size="xl"
          onClick={onClose}
          disabled={reorder.isPending}
        >
          Cancel
        </Button>
        <Button
          size="xl"
          disabled={!dirty || reorder.isPending}
          onClick={() =>
            reorder.mutate(
              { parentId, orderedIds: order.map((node) => node.id) },
              { onSuccess: onClose },
            )
          }
        >
          {reorder.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {reorder.isPending ? "Saving…" : "Save order"}
        </Button>
      </div>
    </>
  );
}
