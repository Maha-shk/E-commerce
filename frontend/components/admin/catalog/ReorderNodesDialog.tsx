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
import { toast } from "sonner";
import { LoadingState } from "@/components/admin/QueryState";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  useCatalogList,
  useMoveCatalogNode,
  useReorderCatalogNodes,
} from "@/lib/hooks/use-catalog";
import type { CatalogLevelSpec, CatalogNode } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

/** The API caps a page at 100, which is also the most `reorder` can cover. */
const PAGE_LIMIT = 100;

/**
 * Sets the order of one level's siblings.
 *
 * This is not cosmetic: the storefront menu is ordered by `position`, so
 * without it an admin cannot control what shoppers see first.
 *
 * Two endpoints back it, chosen by whether the whole sibling set is in hand.
 * `reorder` takes every id and assigns positions by index — one request for a
 * whole rearrangement, and the common case. Past 100 siblings that set can't
 * be fetched in one page, so each move instead goes through `move`, which
 * takes one node and one anchor and lets the server renumber. Same list, same
 * buttons; only when the write happens differs.
 *
 * Moves are buttons rather than drag-and-drop deliberately: it has to work
 * from the keyboard, and a drag library is a lot of weight for a list of this
 * size.
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
      limit: PAGE_LIMIT,
      // Reordering a list sorted by anything else would be meaningless.
      sortBy: "position",
      sortOrder: "asc",
      withCounts: false,
    },
    { enabled: open },
  );

  const rows = data?.data;
  const total = data?.meta.total ?? 0;
  const partial = total > PAGE_LIMIT;

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
        ) : (
          <>
            {partial ? (
              <p className="mt-3 rounded-lg bg-accent px-3 py-2.5 text-xs text-primary">
                Showing the first {PAGE_LIMIT} of {total.toLocaleString()}. Each
                move is saved as you make it.
              </p>
            ) : null}

            <ReorderList
              // Seeds from the loaded order via useState rather than an effect;
              // a fresh fetch remounts and re-seeds.
              key={rows.map((node) => node.id).join("/")}
              level={level}
              initial={rows}
              parentId={parentId}
              // Past one page the complete set isn't in hand, so each move goes
              // through `move` immediately instead of batching into `reorder`.
              immediate={partial}
              onClose={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReorderList({
  level,
  initial,
  parentId,
  immediate,
  onClose,
}: {
  level: CatalogLevelSpec;
  initial: CatalogNode[];
  parentId?: string;
  /** Save each move as it happens, rather than batching into one `reorder`. */
  immediate: boolean;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<CatalogNode[]>(initial);
  const reorder = useReorderCatalogNodes(level.segment);
  const moveNode = useMoveCatalogNode(level.segment);

  const dirty = order.some((node, index) => initial[index]?.id !== node.id);
  const busy = reorder.isPending || moveNode.isPending;

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;

    // The anchor is the row being displaced, read before the local swap.
    const anchor = order[to];
    const lifted = order[from];

    const reordered = [...order];
    reordered.splice(from, 1);
    reordered.splice(to, 0, lifted);
    setOrder(reordered);

    if (!immediate) return;

    /*
     * Optimistic: the row has already moved on screen. A failure puts the list
     * back rather than leaving it showing an order the server didn't accept.
     */
    moveNode.mutate(
      to < from
        ? { id: lifted.id, beforeId: anchor.id }
        : { id: lifted.id, afterId: anchor.id },
      {
        onError: (error) => {
          setOrder(order);
          toast.error(getApiErrorMessage(error));
        },
      },
    );
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
              disabled={index === 0 || busy}
              aria-label={`Move ${node.name} up`}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={index === order.length - 1 || busy}
              aria-label={`Move ${node.name} down`}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown />
            </Button>
          </li>
        ))}
      </ol>

      {/* Each move has already been saved in immediate mode, so there is
          nothing left to confirm — only a way out. */}
      {immediate ? (
        <div className="flex justify-end">
          <Button variant="outline" size="xl" onClick={onClose} disabled={busy}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="xl" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="xl"
            disabled={!dirty || busy}
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
      )}
    </>
  );
}
