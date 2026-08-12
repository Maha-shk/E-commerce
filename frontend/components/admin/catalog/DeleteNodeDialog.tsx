"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, PackageOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/client";
import { useDeleteCatalogNode } from "@/lib/hooks/use-catalog";
import { levelForKey, productsBeneathHref, type CatalogNode } from "@/lib/api/catalog";

/**
 * Delete a catalog node, with the two ways it can be blocked made actionable.
 *
 * The server refuses a delete in two distinct situations, and they have
 * different remedies:
 *
 *   - Products sit beneath it. There is no cascade for this, deliberately —
 *     a product carries pricing and order history, so dropping one has to be
 *     an explicit act on the Products screen, not a side effect of tidying the
 *     tree. The way out is to move them.
 *   - Child levels exist but no products. `?cascade=true` removes the subtree.
 *
 * The node already reports both counts, so the dialog says which case it is
 * before asking — but the 409 is still handled, because a count read a minute
 * ago is not a permission to delete now.
 */
export function DeleteNodeDialog({
  node,
  onClose,
  onDeleted,
}: {
  /** The node to delete. `null` closes the dialog. */
  node: CatalogNode | null;
  onClose: () => void;
  /** Called after a successful delete — navigate away from a detail page. */
  onDeleted?: () => void;
}) {
  if (!node) return null;

  // Keyed on the target, so a new node starts from a clean slate instead of
  // inheriting the previous one's refusal.
  return (
    <DeleteNodeBody key={node.id} node={node} onClose={onClose} onDeleted={onDeleted} />
  );
}

function DeleteNodeBody({
  node,
  onClose,
  onDeleted,
}: {
  node: CatalogNode;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  // A node reports its level key; the endpoint is addressed by URL segment.
  const remove = useDeleteCatalogNode(levelForKey(node.level).segment);
  const [serverBlock, setServerBlock] = useState<string | null>(null);

  /*
   * `productCount` is null when the list that supplied this node skipped the
   * roll-up, which is not the same as zero. An unknown count still offers the
   * delete — the server's 409 is the authority and is rendered inline — but it
   * can't claim a specific number of blocking products, so that panel only
   * appears once we actually know.
   */
  const productCount = node.productCount;
  const blockedByProducts = productCount !== null && productCount > 0;
  const hasChildren = node.childCount > 0;
  const childNoun = node.childLevelLabel.toLowerCase();

  function handleDelete(cascade: boolean) {
    setServerBlock(null);

    remove.mutate(
      { id: node.id, cascade },
      {
        onSuccess: () => {
          onClose();
          onDeleted?.();
        },
        // Shown inline rather than as a toast: on a 409 the message names the
        // blocker, and the unblocking action is right here in the dialog.
        onError: (error) => setServerBlock(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>Delete {node.levelLabel.toLowerCase()}?</DialogTitle>
          <DialogDescription>
            <strong className="font-semibold text-foreground">{node.name}</strong>{" "}
            {blockedByProducts
              ? "cannot be deleted while products sit beneath it."
              : "will be permanently removed. This cannot be undone."}
          </DialogDescription>
        </DialogHeader>

        {blockedByProducts ? (
          <div className="flex gap-3 rounded-lg bg-warning-muted p-3.5 text-sm text-warning">
            <PackageOpen className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="space-y-2">
              <p>
                <strong className="font-semibold">
                  {productCount!.toLocaleString()}
                </strong>{" "}
                product{productCount === 1 ? "" : "s"} still{" "}
                {productCount === 1 ? "sits" : "sit"} beneath it. Products are
                never deleted along with the tree — select them and move them to
                another model first.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={productsBeneathHref(node.level, node.id)}>
                  Move these products
                </Link>
              </Button>
            </div>
          </div>
        ) : hasChildren ? (
          <div className="flex gap-3 rounded-lg bg-warning-muted p-3.5 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              It still contains{" "}
              <strong className="font-semibold">{node.childCount}</strong> {childNoun}.
              Deleting everything inside removes them too.
            </p>
          </div>
        ) : null}

        {serverBlock ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {serverBlock}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="xl" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>

          {blockedByProducts ? null : hasChildren ? (
            <Button
              variant="destructive"
              size="xl"
              disabled={remove.isPending}
              onClick={() => handleDelete(true)}
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Delete everything inside
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="xl"
              disabled={remove.isPending}
              onClick={() => handleDelete(false)}
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Delete {node.levelLabel.toLowerCase()}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
