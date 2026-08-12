"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { CATALOG_ICONS, CATALOG_ICON_KEYS } from "@/lib/catalog-icons";
import {
  useCatalogList,
  useCreateCatalogNode,
  useUpdateCatalogNode,
} from "@/lib/hooks/use-catalog";
import type {
  CatalogLevelSpec,
  CatalogNode,
  CatalogNodeBody,
  CatalogStatus,
  CatalogVisibility,
} from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

/**
 * Create/edit for any level of the hierarchy.
 *
 * The four levels take the same body, so this is one form rather than four.
 * What varies is read off the level spec: the title, the parent it requires,
 * and the two level-specific fields (`releaseYear` on a Model; Categories keep
 * a legacy `icon`). Four copies of this form would have been four places for
 * the validation rules to drift.
 */
export function CatalogNodeModal({
  open,
  onClose,
  level,
  node,
  parentId,
  parentName,
}: {
  open: boolean;
  onClose: () => void;
  level: CatalogLevelSpec;
  /** Omit to create. */
  node?: CatalogNode;
  /** Parent fixed by context — a drill-down page already knows it. */
  parentId?: string;
  /** Shown instead of the parent picker when the parent is fixed. */
  parentName?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto sm:max-w-xl sm:p-6">
        {open ? (
          <NodeFields
            // Remounts on target change, so every field re-seeds from the new
            // node instead of keeping the previous one's values.
            key={node?.id ?? `new-${parentId ?? "root"}`}
            level={level}
            node={node}
            parentId={parentId}
            parentName={parentName}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Name → URL-safe slug, matching what the server derives when none is sent. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function NodeFields({
  level,
  node,
  parentId: fixedParentId,
  parentName,
  onClose,
}: {
  level: CatalogLevelSpec;
  node?: CatalogNode;
  parentId?: string;
  parentName?: string;
  onClose: () => void;
}) {
  const isEdit = Boolean(node);
  const isCategory = level.key === "CATEGORY";

  const [name, setName] = useState(node?.name ?? "");
  const [description, setDescription] = useState(node?.description ?? "");
  const [imageUrl, setImageUrl] = useState(node?.imageUrl ?? "");
  const [status, setStatus] = useState<CatalogStatus>(node?.status ?? "ACTIVE");
  const [visibility, setVisibility] = useState<CatalogVisibility>(
    node?.visibility ?? "VISIBLE",
  );
  const [metaTitle, setMetaTitle] = useState(node?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(node?.metaDescription ?? "");
  const [releaseYear, setReleaseYear] = useState(
    node?.releaseYear != null ? String(node.releaseYear) : "",
  );
  const [icon, setIcon] = useState(node?.icon ?? "");
  const [parentId, setParentId] = useState(node?.parentId ?? fixedParentId ?? "");
  const [seoOpen, setSeoOpen] = useState(false);

  /*
   * The slug follows the name until the admin types their own — deriving it
   * rather than syncing it in an effect, which fights the input on every
   * keystroke and makes the field uneditable while the name is being typed.
   */
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const slug = slugOverride ?? node?.slug ?? slugify(name);

  /*
   * Filing follows the rename until the admin says otherwise — derived rather
   * than synced, for the same reason as the slug: an effect writing this on
   * every keystroke would fight the checkbox.
   */
  const [filedOverride, setFiledOverride] = useState<boolean | null>(null);
  const renamed = Boolean(node) && name.trim() !== node!.name;
  const filed = filedOverride ?? renamed;

  const create = useCreateCatalogNode(level.segment);
  const update = useUpdateCatalogNode(level.segment);
  const saving = create.isPending || update.isPending;

  // Only needed when the parent isn't already known from the route.
  const needsParentPicker = Boolean(level.parent) && !fixedParentId;
  const { data: parentOptions, isPending: parentsPending } = useCatalogList(
    level.parent?.segment ?? "categories",
    { limit: 100, withCounts: false, sortBy: "name", sortOrder: "asc" },
    { enabled: needsParentPicker },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
    };
    const year = releaseYear.trim() ? Number(releaseYear) : undefined;

    if (isEdit && node) {
      /*
       * PATCH carries only what actually changed. The API rejects unknown
       * properties outright, and sending the whole node back — id, counts,
       * timestamps and all — is what used to make a simple archive fail with
       * a 400.
       */
      const body: CatalogNodeBody = {};
      if (trimmed.name !== node.name) body.name = trimmed.name;
      if (trimmed.slug !== node.slug) body.slug = trimmed.slug;
      if (trimmed.description !== (node.description ?? "")) {
        body.description = trimmed.description;
      }
      if (trimmed.imageUrl !== (node.imageUrl ?? "")) body.imageUrl = trimmed.imageUrl;
      if (status !== node.status) body.status = status;
      if (visibility !== node.visibility) body.visibility = visibility;
      if (trimmed.metaTitle !== (node.metaTitle ?? "")) body.metaTitle = trimmed.metaTitle;
      if (trimmed.metaDescription !== (node.metaDescription ?? "")) {
        body.metaDescription = trimmed.metaDescription;
      }
      if (level.holdsProducts && year !== (node.releaseYear ?? undefined)) {
        body.releaseYear = year;
      }
      if (isCategory && icon !== (node.icon ?? "")) body.icon = icon;
      // Only ever clears the flag — nothing in the UI turns a real node back
      // into a placeholder, which is a migration artefact, not a state.
      if (node.isPlaceholder && filed) body.isPlaceholder = false;
      // Re-files the node; its descendants travel with it.
      if (level.parent && parentId && parentId !== node.parentId) {
        body.parentId = parentId;
      }

      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }

      update.mutate({ id: node.id, body }, { onSuccess: onClose });
      return;
    }

    const body: CatalogNodeBody = { name: trimmed.name };
    if (level.parent) body.parentId = parentId;
    // Omitting the slug is fine — the server derives it from the name. Only
    // send one when the admin has actually chosen it.
    if (slugOverride?.trim()) body.slug = trimmed.slug;
    if (trimmed.description) body.description = trimmed.description;
    if (trimmed.imageUrl) body.imageUrl = trimmed.imageUrl;
    if (status !== "ACTIVE") body.status = status;
    if (visibility !== "VISIBLE") body.visibility = visibility;
    if (trimmed.metaTitle) body.metaTitle = trimmed.metaTitle;
    if (trimmed.metaDescription) body.metaDescription = trimmed.metaDescription;
    if (level.holdsProducts && year !== undefined) body.releaseYear = year;
    if (isCategory && icon) body.icon = icon;

    create.mutate(body, { onSuccess: onClose });
  }

  const parentRequiredButMissing = Boolean(level.parent) && !parentId;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle>
          {isEdit ? `Edit ${level.label}` : `New ${level.label}`}
        </DialogTitle>
        <DialogDescription>
          {level.parent
            ? `Every ${level.label} belongs to a ${level.parent.label}.`
            : `A ${level.label} sits at the top of the catalogue.`}
        </DialogDescription>
      </DialogHeader>

      {node?.isPlaceholder ? (
        <div className="space-y-2.5 rounded-lg bg-warning-muted px-3 py-2.5 text-xs text-warning">
          <p>
            The migration created this {level.label.toLowerCase()} so existing
            products had somewhere to sit.
          </p>
          {/* Ticked for you once the name changes, since renaming a "General"
              is what filing one looks like — but left as a real choice: an
              admin may rename a catch-all and still mean it as a catch-all. */}
          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <Checkbox
              checked={filed}
              onCheckedChange={(checked) => setFiledOverride(checked === true)}
            />
            This is a real {level.label.toLowerCase()} now
          </label>
        </div>
      ) : null}

      {/* Parent */}
      {level.parent ? (
        <div className="space-y-2">
          <Label htmlFor="node-parent">{level.parent.label}</Label>
          {fixedParentId ? (
            <p className="flex h-11 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
              {parentName ?? "Selected"}
            </p>
          ) : (
            <NativeSelect
              id="node-parent"
              className="h-11 rounded-lg bg-muted/40"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            >
              <option value="" disabled>
                {parentsPending
                  ? "Loading…"
                  : `Choose a ${level.parent.label.toLowerCase()}…`}
              </option>
              {(parentOptions?.data ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </NativeSelect>
          )}
          {isEdit && !fixedParentId ? (
            <p className="text-xs text-muted-foreground">
              Moving this {level.label.toLowerCase()} takes everything inside it along.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="node-name">Name</Label>
        <Input
          id="node-name"
          className="h-11 rounded-lg bg-muted/40"
          placeholder={placeholderFor(level.key)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={160}
          required
          autoFocus
        />
      </div>

      {/* Slug + status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="node-slug">URL slug</Label>
          <Input
            id="node-slug"
            className="h-11 rounded-lg bg-muted/40"
            value={slug}
            onChange={(e) => setSlugOverride(e.target.value)}
            maxLength={180}
          />
          {/* Slugs are unique per parent, not globally — two categories can
              each hold a "general" without conflicting. */}
          <p className="text-xs text-muted-foreground">
            Must be unique among its siblings only.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-status">Status</Label>
          <NativeSelect
            id="node-status"
            className="h-11 rounded-lg bg-muted/40"
            value={status}
            onChange={(e) => setStatus(e.target.value as CatalogStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </NativeSelect>
        </div>
      </div>

      {/* Visibility + release year */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="node-visibility">Storefront visibility</Label>
          <div className="relative">
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 left-3 z-10 size-2 -translate-y-1/2 rounded-full",
                visibility === "VISIBLE" ? "bg-success" : "bg-subtle",
              )}
            />
            <NativeSelect
              id="node-visibility"
              className="h-11 rounded-lg bg-muted/40 pl-7"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as CatalogVisibility)}
            >
              <option value="VISIBLE">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </NativeSelect>
          </div>
        </div>

        {level.holdsProducts ? (
          <div className="space-y-2">
            <Label htmlFor="node-year">Release year</Label>
            <Input
              id="node-year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2200}
              className="h-11 rounded-lg bg-muted/40"
              placeholder="2025"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
            />
          </div>
        ) : null}
      </div>

      {/* Hiding a branch hides everything under it, but the children keep their
          own status — so restoring the parent restores exactly what was there. */}
      {(status === "ARCHIVED" || visibility === "HIDDEN") && (node?.childCount ?? 0) > 0 ? (
        <p className="rounded-lg bg-warning-muted px-3 py-2.5 text-xs text-warning">
          This hides all {node?.childCount} {node?.childLevelLabel.toLowerCase()} beneath
          it from the storefront. They keep their own status.
        </p>
      ) : null}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="node-description">Description</Label>
        <textarea
          id="node-description"
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder={`What belongs in this ${level.label.toLowerCase()}?`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ImageUploadField
        label={level.key === "COMPANY" ? "Logo" : "Image"}
        value={imageUrl}
        onChange={setImageUrl}
        folder="categories"
      />

      {/* Category only — the three lower levels use logos, not glyphs. */}
      {isCategory ? <IconPicker value={icon} onChange={setIcon} /> : null}

      {/* SEO — collapsed, since it is optional on every level */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setSeoOpen((v) => !v)}
          aria-expanded={seoOpen}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground"
        >
          Search engine listing
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              seoOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {seoOpen ? (
          <div className="space-y-4 border-t border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="node-meta-title">Meta title</Label>
              <Input
                id="node-meta-title"
                className="h-11 rounded-lg bg-muted/40"
                maxLength={200}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-meta-description">Meta description</Label>
              <textarea
                id="node-meta-description"
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="xl" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="xl" disabled={saving || parentRequiredButMissing}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {saving ? "Saving…" : isEdit ? "Save changes" : `Create ${level.label}`}
        </Button>
      </div>
    </form>
  );
}

/**
 * The glyph a category falls back to when it has no artwork.
 *
 * A grid of the actual icons rather than a list of their names — the admin is
 * choosing something visual, and "PawPrint" in a dropdown doesn't show what
 * lands on the tile.
 */
function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label>Icon</Label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label="Category icon"
        className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-input bg-muted/40 p-2 sm:grid-cols-10"
      >
        {CATALOG_ICON_KEYS.map((key) => {
          const Icon = CATALOG_ICONS[key];
          const active = value === key;

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={key}
              title={key}
              onClick={() => onChange(active ? "" : key)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Shown on tiles and in navigation when there is no image.
      </p>
    </div>
  );
}

/** A concrete example beats "e.g. name" at explaining what a level holds. */
function placeholderFor(key: CatalogLevelSpec["key"]): string {
  switch (key) {
    case "CATEGORY":
      return "Electronics";
    case "COMPANY":
      return "Samsung";
    case "PRODUCT_TYPE":
      return "Mobile Phones";
    case "MODEL":
      return "Galaxy S25";
  }
}
