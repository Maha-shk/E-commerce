"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BannerModal } from "@/components/admin/BannerModal";
import {
  useBanners,
  useDeleteBanner,
  useReorderBanners,
  useSetBannerActive,
} from "@/lib/hooks/use-admin";
import type { Banner } from "@/lib/api/services/admin";
import { cn } from "@/lib/utils";

const SLOTS = ["HERO", "PROMOTIONAL", "SIDEBAR"] as const;

/** Formats a scheduling window into a short human phrase. */
function scheduleLabel(banner: Banner): string | null {
  const start = banner.startDate ? new Date(banner.startDate) : null;
  const end = banner.endDate ? new Date(banner.endDate) : null;
  if (!start && !end) return null;

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

/** True when a banner is published but outside its scheduled window. */
function isDormant(banner: Banner): boolean {
  if (!banner.isActive) return false;
  const now = Date.now();
  if (banner.startDate && new Date(banner.startDate).getTime() > now) return true;
  if (banner.endDate && new Date(banner.endDate).getTime() < now) return true;
  return false;
}

export default function BannersPage() {
  const [slot, setSlot] = useState<(typeof SLOTS)[number]>("HERO");
  const [modalTarget, setModalTarget] = useState<Banner | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  // Filtered by slot: display order is per-slot, so reordering only makes
  // sense within one.
  const { data, isPending, isError } = useBanners({ type: slot, limit: 100 });
  const setActive = useSetBannerActive();
  const reorder = useReorderBanners();
  const remove = useDeleteBanner();

  const banners = useMemo(() => data?.data ?? [], [data]);

  /** Moves a banner one place and persists the whole new sequence. */
  const move = (index: number, direction: -1 | 1) => {
    const next = [...banners];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((b) => b.id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        subtitle="Artwork shown on the storefront hero and promotional slots."
        action={
          <Button onClick={() => setModalTarget("new")}>
            <Plus className="size-4" aria-hidden />
            New banner
          </Button>
        }
      />

      {/* Slot picker */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <label htmlFor="slot" className="text-sm font-medium">
            Slot
          </label>
          <NativeSelect
            id="slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value as (typeof SLOTS)[number])}
            className="w-48"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
          <p className="text-sm text-muted-foreground">
            The storefront rotates through every published banner in this slot, in this order.
          </p>
        </CardContent>
      </Card>

      {/* List */}
      {isPending ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading banners…</p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <TriangleAlert className="size-6 text-warning" aria-hidden />
            <p className="text-sm font-medium">Couldn&apos;t load banners</p>
          </CardContent>
        </Card>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No {slot} banners yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              The storefront falls back to its built-in artwork until you publish
              one here.
            </p>
            <Button className="mt-3" variant="outline" onClick={() => setModalTarget("new")}>
              <Plus className="size-4" aria-hidden />
              Create the first one
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => {
            const dormant = isDormant(banner);
            const schedule = scheduleLabel(banner);

            return (
              <Card key={banner.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {/* Reorder */}
                  <div className="flex shrink-0 flex-row gap-1 sm:flex-col">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move up"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={index === banners.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </Button>
                  </div>

                  {/* Thumbnail */}
                  <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- banner
                        art lives on arbitrary hosts, which next/image can't take
                        without allow-listing each one. */}
                    <img
                      src={banner.imageUrl}
                      alt=""
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                  </div>

                  {/* Detail */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{banner.title}</p>
                      {index === 0 && banner.isActive && !dormant ? (
                        <Badge variant="success" className="h-5 px-2 text-xs">
                          Live
                        </Badge>
                      ) : null}
                      {dormant ? (
                        <Badge variant="warning" className="h-5 px-2 text-xs">
                          Scheduled
                        </Badge>
                      ) : null}
                    </div>

                    {banner.description ? (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {banner.description}
                      </p>
                    ) : null}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Order {banner.displayOrder}</span>
                      {banner.linkUrl ? (
                        <span className="inline-flex items-center gap-1">
                          <ExternalLink className="size-3" aria-hidden />
                          {banner.linkText || "Link"} → {banner.linkUrl}
                        </span>
                      ) : null}
                      {schedule ? <span>{schedule}</span> : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={banner.isActive}
                      disabled={setActive.isPending}
                      aria-label={`Publish ${banner.title}`}
                      onCheckedChange={(checked) =>
                        setActive.mutate({ id: banner.id, isActive: checked })
                      }
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${banner.title}`}
                      onClick={() => setModalTarget(banner)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Delete ${banner.title}`}
                      className={cn("text-muted-foreground hover:text-destructive")}
                      onClick={() => setToDelete(banner)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BannerModal target={modalTarget} onClose={() => setModalTarget(null)} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Delete this banner?"
        description={
          toDelete
            ? `"${toDelete.title}" will be removed from the storefront. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
        }}
      />
    </div>
  );
}
