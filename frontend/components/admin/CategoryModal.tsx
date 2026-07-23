"use client";

import { useState, useEffect } from "react";
import { Archive, ArchiveRestore, ImagePlus, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateCategory, useUpdateCategory } from "@/lib/hooks/use-admin";
import type { Category, CategoryVisibility } from "@/lib/api/models";

type CategoryModalProps = {
  /** Truthy when the modal is open. Pass a Category to edit, or `"new"` to add. */
  target: Category | "new" | null;
  onClose: () => void;
  /** Toggles the category between active and archived. */
  onToggleArchive: (category: Category) => void;
};

/** Slugify helper: converts a category name into a URL-safe slug. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryModal({ target, onClose, onToggleArchive }: CategoryModalProps) {
  const isEdit = target && target !== "new";

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-0 sm:max-w-xl sm:p-6">
        {target && (
          <CategoryFields
            key={isEdit ? target.id : "new"}
            category={isEdit ? target : undefined}
            onClose={onClose}
            onToggleArchive={onToggleArchive}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* Shared field styles — matches the filled inputs used across admin forms. */
const fieldClass = "h-11 rounded-lg bg-muted/40";
const labelClass = "text-sm font-medium text-muted-foreground";

type Thumbnail = { name: string; size: string; url?: string };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CategoryFields({
  category,
  onClose,
  onToggleArchive,
}: {
  category?: Category;
  onClose: () => void;
  onToggleArchive: (category: Category) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [visibility, setVisibility] = useState<CategoryVisibility>(
    category?.visibility ?? "VISIBLE",
  );
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(
    category?.thumbnailName
      ? { name: category.thumbnailName, size: category.thumbnailSize || "0 B" }
      : null,
  );

  const [slug, setSlug] = useState(category?.slug ?? "");

  // Auto-generate slug from name
  useEffect(() => {
    if (!category?.slug) {
      setSlug(slugify(name));
    }
  }, [name, category?.slug]);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setThumbnail({
      name: file.name,
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    });
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    const body = {
      name,
      slug,
      description,
      visibility,
    };

    if (category) {
      // Update existing
      updateCategory.mutate(
        { id: category.id, body },
        {
          onSuccess: () => {
            toast.success("Category updated successfully");
            onClose();
          },
        },
      );
    } else {
      // Create new
      createCategory.mutate(body, {
        onSuccess: () => {
          toast.success("Category created successfully");
          onClose();
        },
      });
    }
  }

  function handleArchive() {
    if (!category) return;
    onToggleArchive(category);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
        <DialogDescription>
          {category
            ? "Update this category's details and storefront visibility."
            : "Organize your catalog with a new root category."}
        </DialogDescription>
      </DialogHeader>

      {/* Category name */}
      <div className="space-y-2">
        <label htmlFor="cat-name" className={labelClass}>
          Category Name
        </label>
        <Input
          id="cat-name"
          className={fieldClass}
          placeholder="e.g., Summer Collection 2024"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Slug + visibility */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="cat-slug" className={labelClass}>
            URL Slug
          </label>
          <div className="relative">
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="summer-collection-2024"
              className={fieldClass}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="cat-visibility" className={labelClass}>
            Visibility
          </label>
          <div className="relative">
            <span
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 z-10 size-2 -translate-y-1/2 rounded-full",
                visibility === "VISIBLE" ? "bg-green" : "bg-subtle",
              )}
            />
            <NativeSelect
              id="cat-visibility"
              className={`${fieldClass} pl-7`}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as CategoryVisibility)}
            >
              <option value="VISIBLE">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="cat-desc" className={labelClass}>
          Description
        </label>
        <textarea
          id="cat-desc"
          rows={3}
          className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Describe this category's unique value proposition…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <span className={labelClass}>Category Media</span>
        <button
          type="button"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/svg+xml,image/png,image/jpeg";
            input.onchange = (e) => handleFile((e.target as HTMLInputElement).files);
            input.click();
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors",
            "border-border bg-muted/30 hover:bg-muted/50",
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-card ring-1 ring-border">
            <ImagePlus className="size-5 text-primary" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Upload Thumbnail</span>
            <span className="mt-0.5 block text-xs text-subtle">SVG, PNG, JPG (Max 2MB)</span>
          </span>
        </button>

        {thumbnail && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-primary">
              {thumbnail.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
                <img src={thumbnail.url} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{thumbnail.name}</p>
              <p className="text-xs text-subtle">{thumbnail.size}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove thumbnail"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setThumbnail(null)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        {category ? (
          <Button
            type="button"
            variant="outline"
            size="xl"
            onClick={handleArchive}
            disabled={createCategory.isPending || updateCategory.isPending}
          >
            {category.status === "ARCHIVED" ? <ArchiveRestore /> : <Archive />}
            {category.status === "ARCHIVED" ? "Restore Category" : "Archive Category"}
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="xl"
            onClick={onClose}
            disabled={createCategory.isPending || updateCategory.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="xl"
            disabled={createCategory.isPending || updateCategory.isPending}
          >
            {createCategory.isPending || updateCategory.isPending ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </div>
    </form>
  );
}
