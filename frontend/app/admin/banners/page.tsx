"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImageOff,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BannerModal } from "@/components/admin/BannerModal";
import { ErrorState, LoadingState } from "@/components/admin/QueryState";
import {
  useBanners,
  useDeleteBanner,
  useReorderBanners,
  useSetBannerActive,
} from "@/lib/hooks/use-admin";
import { formatDate } from "@/lib/admin/format";
import type { Banner } from "@/lib/api/services/admin";
import { cn } from "@/lib/utils";

/**
 * Storefront slots, with a plain-English note about where each one shows.
 * The picker used to be a `<select>` listing raw enum values ("HERO",
 * "PROMOTIONAL") with no indication of what they controlled.
 */
const SLOTS = [
  {
    value: "HERO" as const,
    label: "Hero",
    hint: "The large rotating banner at the top of the homepage.",
  },
  {
    value: "PROMOTIONAL" as const,
    label: "Promotional",
    hint: "Secondary promo placements across the storefront.",
  },
  {
    value: "SIDEBAR" as const,
    label: "Sidebar",
    hint: "Narrow placements beside listing pages.",
  },
];

type Slot = (typeof SLOTS)[number]["value"];

/** Formats a scheduling window into a short human phrase. */
function scheduleLabel(banner: Banner): string | null {
  const start = banner.startDate ? formatDate(banner.startDate) : null;
  const end = banner.endDate ? formatDate(banner.endDate) : null;
  if (!start && !end) return null;

  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

/** True when a banner is published but outside its scheduled window. */
function isDormant(banner: Banner): boolean {
  if (!banner.isActive) return false;
  const now = Date.now();
  if (banner.startDate && new Date(banner.startDate).getTime() > now) return true;
  if (banner.endDate && new Date(banner.endDate).getTime() < now) return true;
  return false;
}

/** Banner artwork, with a real placeholder when the URL is broken. */
function BannerThumb({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
      {src && !failed ? (
        /* eslint-disable-next-line @next/next/no-img-element -- banner art lives
           on arbitrary hosts, which next/image can't take without allow-listing
           each one. */
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          // Was `e.currentTarget.style.visibility = "hidden"` — a direct DOM
          // mutation that left an unexplained empty box.
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex flex-col items-center gap-1 px-2 text-center">
          <ImageOff className="size-5" aria-hidden />
          <span className="text-[10px] leading-tight">Image unavailable</span>
        </span>
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}

export default function BannersPage() {
  const [slot, setSlot] = useState<Slot>("HERO");
  const [modalTarget, setModalTarget] = useState<Banner | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  // Filtered by slot: display order is per-slot, so reordering only makes
  // sense within one.
  const { data, isPending, isError, error, refetch } = useBanners({ type: slot, limit: 100 });
  const setActive = useSetBannerActive();
  const reorder = useReorderBanners();
  const remove = useDeleteBanner();

  const banners = useMemo(() => data?.data ?? [], [data]);
  const activeSlot = SLOTS.find((s) => s.value === slot)!;
  const liveCount = banners.filter((b) => b.isActive && !isDormant(b)).length;

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
          <Button size="lg" onClick={() => setModalTarget("new")}>
            <Plus className="size-4" aria-hidden />
            New banner
          </Button>
        }
      />

      {/* Slot picker */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Banner slot"
            className="inline-flex rounded-lg bg-muted p-1"
          >
            {SLOTS.map((option) => {
              const isSelected = slot === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSlot(option.value)}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isSelected
                      ? "bg-card text-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">{activeSlot.hint}</p>
        </div>

        {!isPending && !isError && banners.length > 0 ? (
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {/* The storefront rotates through every live banner in this slot —
                this used to claim only the first one was ever shown. */}
            <span className="font-medium text-foreground tabular-nums">{liveCount}</span> of{" "}
            <span className="font-medium text-foreground tabular-nums">{banners.length}</span>{" "}
            live. The storefront rotates through them in this order.
          </div>
        ) : null}
      </Card>

      {/* List */}
      {isPending ? (
        <Card className="gap-0 py-0">
          <LoadingState label="Loading banners…" />
        </Card>
      ) : isError ? (
        <Card className="gap-0 py-0">
          <div className="p-5">
            {/* The error card had no way to recover — just a warning icon. */}
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        </Card>
      ) : banners.length === 0 ? (
        <Card className="gap-0 py-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden />
            </span>
            <p className="text-base font-semibold tracking-tight">
              No {activeSlot.label.toLowerCase()} banners yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              The storefront falls back to its built-in artwork until you publish one here.
            </p>
            <Button className="mt-5" variant="outline" onClick={() => setModalTarget("new")}>
              <Plus className="size-4" aria-hidden />
              Create the first one
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => {
            const dormant = isDormant(banner);
            const schedule = scheduleLabel(banner);
            const isLive = banner.isActive && !dormant;

            return (
              <Card
                key={banner.id}
                className={cn("gap-0 py-0", !banner.isActive && "opacity-70")}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {/* Reorder */}
                  <div className="flex shrink-0 flex-row gap-1 sm:flex-col">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Move ${banner.title} up`}
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Move ${banner.title} down`}
                      disabled={index === banners.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </Button>
                  </div>

                  <BannerThumb src={banner.imageUrl} title={banner.title} />

                  {/* Detail */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">{banner.title}</p>

                      {/* Every live banner is live — the badge used to be
                          pinned to `index === 0`, from when the storefront
                          only rendered the first one. */}
                      {isLive ? (
                        <Badge variant="success" className="h-5 px-2 text-xs">
                          Live
                        </Badge>
                      ) : dormant ? (
                        <Badge variant="warning" className="h-5 px-2 text-xs">
                          Out of schedule
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="h-5 px-2 text-xs">
                          Draft
                        </Badge>
                      )}
                    </div>

                    {banner.description ? (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {banner.description}
                      </p>
                    ) : null}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="tabular-nums">Position {index + 1}</span>
                      {banner.mobileImageUrl ? <span>Has mobile crop</span> : null}
                      {banner.linkUrl ? (
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">
                            {banner.linkText || "Link"} → {banner.linkUrl}
                          </span>
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
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setToDelete(banner)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
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
          toDelete ? (
            <>
              <strong className="font-semibold text-foreground">{toDelete.title}</strong> will be
              removed from the storefront. This cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
        }}
      />
    </div>
  );
}
