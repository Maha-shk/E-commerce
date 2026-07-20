"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  Eye,
  ImagePlus,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify, type Category, type CategoryVisibility } from "@/lib/admin/categories";
import { cn } from "@/lib/utils";

type CategoryFormProps = {
  mode: "add" | "edit";
  /** Existing category data — omit for "add" so every field starts empty. */
  category?: Category;
};

type Thumbnail = { name: string; size: string; url?: string };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter();

  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [visibility, setVisibility] = useState<CategoryVisibility>(
    category?.visibility ?? "visible",
  );
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(category?.thumbnail ?? null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Slug is auto-generated from the name (falls back to any existing slug when untouched).
  const slug = useMemo(() => slugify(name) || (name ? "" : category?.slug ?? ""), [name, category]);

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setThumbnail({
      name: file.name,
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Frontend-only for now — no backend to persist to yet.
    router.push("/admin/categories");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-subtle">
            Categories
            <ChevronRight className="size-3.5" />
            {mode === "add" ? "Add" : "Edit"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
            {mode === "add" ? "Add New Category" : "Edit Category"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="xl">
            <Link href="/admin/categories">Cancel</Link>
          </Button>
          <Button type="submit" size="xl">
            Save Category
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Information */}
          <Card className="gap-0 py-0">
            <CardContent className="space-y-5 p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                General Information
              </h2>

              <div className="space-y-2">
                <label htmlFor="cat-name" className="text-sm font-medium text-muted-foreground">
                  Category Name
                </label>
                <Input
                  id="cat-name"
                  className="h-11 rounded-lg bg-muted/40"
                  placeholder="e.g., Summer Collection 2024"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cat-slug" className="text-sm font-medium text-muted-foreground">
                  URL Slug
                </label>
                <div className="relative">
                  <Input
                    id="cat-slug"
                    readOnly
                    value={slug}
                    placeholder="summer-collection-2024"
                    className="h-11 rounded-lg bg-muted/40 pr-24 italic text-muted-foreground"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold tracking-wide text-subtle">
                    <Lock className="size-3" />
                    AUTO
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="cat-desc" className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  rows={5}
                  className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Describe this category's unique value proposition…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visibility status */}
          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary ring-1 ring-border">
                <Eye className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Visibility Status</p>
                <p className="text-sm text-subtle">Make this category visible on the storefront.</p>
              </div>
            </div>

            <div className="relative shrink-0">
              <span
                className={cn(
                  "pointer-events-none absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full",
                  visibility === "visible" ? "bg-green" : "bg-subtle",
                )}
              />
              <select
                aria-label="Visibility status"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as CategoryVisibility)}
                className="h-10 appearance-none rounded-lg border border-input bg-card pl-7 pr-9 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            </div>
          </div>
        </div>

        {/* Right column: media */}
        <Card className="gap-0 py-0">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Category Media</h2>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFile(e.dataTransfer.files);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                dragActive ? "border-primary bg-accent" : "border-border bg-muted/30 hover:bg-muted/50",
              )}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-card ring-1 ring-border">
                <ImagePlus className="size-6 text-primary" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">Upload Thumbnail</span>
                <span className="mt-1 block text-xs text-subtle">SVG, PNG, JPG (Max 2MB)</span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleFile(e.target.files)}
            />

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
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
