"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { useCreateBanner, useUpdateBanner } from "@/lib/hooks/use-admin";
import type { Banner } from "@/lib/api/services/admin";

type BannerModalProps = {
  /** A `Banner` to edit, `"new"` to create, or null when closed. */
  target: Banner | "new" | null;
  onClose: () => void;
};

const TYPES: Banner["type"][] = ["HERO", "PROMOTIONAL", "SIDEBAR"];

/** `<input type="datetime-local">` wants `YYYY-MM-DDTHH:mm`, not a full ISO string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BannerModal({ target, onClose }: BannerModalProps) {
  const isEdit = target !== null && target !== "new";

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 sm:max-w-2xl sm:p-6">
        {target ? (
          <BannerFields
            // Remounts between targets so the form state resets cleanly.
            key={isEdit ? target.id : "new"}
            banner={isEdit ? target : undefined}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BannerFields({ banner, onClose }: { banner?: Banner; onClose: () => void }) {
  const create = useCreateBanner();
  const update = useUpdateBanner();
  const isPending = create.isPending || update.isPending;

  const [form, setForm] = useState({
    type: banner?.type ?? ("HERO" as Banner["type"]),
    title: banner?.title ?? "",
    description: banner?.description ?? "",
    imageUrl: banner?.imageUrl ?? "",
    mobileImageUrl: banner?.mobileImageUrl ?? "",
    linkUrl: banner?.linkUrl ?? "",
    linkText: banner?.linkText ?? "",
    isActive: banner?.isActive ?? true,
    startDate: toLocalInput(banner?.startDate ?? null),
    endDate: toLocalInput(banner?.endDate ?? null),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Give the banner a title");
    if (!form.imageUrl.trim()) return toast.error("An image URL is required");
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) < new Date(form.startDate)
    ) {
      return toast.error("The end date must be after the start date");
    }

    // Empty strings clear the optional columns; the server stores null.
    const body = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      mobileImageUrl: form.mobileImageUrl.trim() || undefined,
      linkUrl: form.linkUrl.trim() || undefined,
      linkText: form.linkText.trim() || undefined,
      isActive: form.isActive,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    };

    const onSuccess = () => onClose();
    if (banner) update.mutate({ id: banner.id, body }, { onSuccess });
    else create.mutate(body, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{banner ? "Edit banner" : "New banner"}</DialogTitle>
        <DialogDescription>
          Banners appear on the storefront in display order. Only active banners
          inside their date window are shown.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Slot</Label>
            <NativeSelect
              id="type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as Banner["type"])}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Summer Sale"
              maxLength={200}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Up to 40% off selected items"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://…/hero.jpg"
          />
          {form.imageUrl ? (
            /* Arbitrary remote host; next/image would need it allow-listed. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt=""
              className="mt-2 h-28 w-full rounded-lg border border-border object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobileImageUrl">Mobile image URL (optional)</Label>
          <Input
            id="mobileImageUrl"
            value={form.mobileImageUrl}
            onChange={(e) => set("mobileImageUrl", e.target.value)}
            placeholder="https://…/hero-mobile.jpg"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input
              id="linkUrl"
              value={form.linkUrl}
              onChange={(e) => set("linkUrl", e.target.value)}
              placeholder="/sales"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkText">Button text</Label>
            <Input
              id="linkText"
              value={form.linkText}
              onChange={(e) => set("linkText", e.target.value)}
              placeholder="Shop Now"
              maxLength={80}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Starts (optional)</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Ends (optional)</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Published</p>
            <p className="text-xs text-muted-foreground">
              Unpublished banners stay in this list but never reach the storefront.
            </p>
          </div>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => set("isActive", checked)}
            aria-label="Published"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {banner ? "Save changes" : "Create banner"}
        </Button>
      </div>
    </form>
  );
}
