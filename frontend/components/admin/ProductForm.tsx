"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Info,
  Image as ImageIcon,
  Layers,
  CreditCard,
  Eye,
  Tag as TagIcon,
  UploadCloud,
  Plus,
  X,
  Globe,
  Lock,
  Clock,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/select-native";
import { productCategories, type Product, type ProductVisibility } from "@/lib/admin/products";
import { cn } from "@/lib/utils";

type ProductFormProps = {
  mode: "add" | "edit";
  /** Existing product data — omit for "add" so every field starts empty. */
  product?: Product;
};

type ImageItem = { id: string; url: string };

const visibilityOptions: {
  value: ProductVisibility;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { value: "public", label: "Public", description: "Visible to all customers", icon: Globe },
  { value: "private", label: "Private", description: "Only internal users", icon: Lock },
  { value: "scheduled", label: "Scheduled", description: "Publish on date", icon: Clock },
];

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState(product?.category ?? productCategories[0]);
  const [description, setDescription] = useState(product?.description ?? "");

  const [images, setImages] = useState<ImageItem[]>(() =>
    (product?.images ?? []).map((url, i) => ({ id: `existing-${i}-${url}`, url })),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const [variants, setVariants] = useState<string[]>(product?.variants ?? []);
  const [variantInput, setVariantInput] = useState("");

  const [sku, setSku] = useState(product?.sku ?? "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");

  const [basePrice, setBasePrice] = useState(product ? String(product.price) : "");
  const [discount, setDiscount] = useState(product ? String(product.discount) : "0");

  const [visibility, setVisibility] = useState<ProductVisibility>(product?.visibility ?? "public");
  const [scheduledDate, setScheduledDate] = useState(product?.scheduledDate ?? "");

  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const { netPrice, tax, total } = useMemo(() => {
    const price = Number(basePrice) || 0;
    const discountPct = Number(discount) || 0;
    const net = price - price * (discountPct / 100);
    const taxAmount = net * 0.22;
    return { netPrice: net, tax: taxAmount, total: net + taxAmount };
  }, [basePrice, discount]);

  function addImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: ImageItem[] = Array.from(files).map((file, i) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...next]);
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function addVariant() {
    const value = variantInput.trim();
    if (!value || variants.includes(value)) {
      setVariantInput("");
      return;
    }
    setVariants((prev) => [...prev, value]);
    setVariantInput("");
  }

  function removeVariant(value: string) {
    setVariants((prev) => prev.filter((v) => v !== value));
  }

  function addTag() {
    const value = tagInput.trim().toUpperCase();
    if (!value || tags.includes(value)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput("");
  }

  function removeTag(value: string) {
    setTags((prev) => prev.filter((t) => t !== value));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Frontend-only for now — no backend to persist to yet.
    router.push("/admin/products");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-subtle">
            Product
            <ChevronRight className="size-3.5" />
            {mode === "add" ? "Add" : "Edit"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="xl">
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button type="submit" size="xl">
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Information */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="product-name"
                  className="text-xs font-semibold uppercase tracking-wider text-subtle"
                >
                  Product Name
                </Label>
                <Input
                  id="product-name"
                  className="h-11 rounded-lg bg-card"
                  placeholder="e.g. Premium Leather Ergonomic Chair"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="brand"
                    className="text-xs font-semibold uppercase tracking-wider text-subtle"
                  >
                    Brand
                  </Label>
                  <Input
                    id="brand"
                    className="h-11 rounded-lg bg-card"
                    placeholder="e.g. Cento Design"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-xs font-semibold uppercase tracking-wider text-subtle"
                  >
                    Category
                  </Label>
                  <NativeSelect
                    id="category"
                    className="h-11 rounded-lg bg-card"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {productCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase tracking-wider text-subtle"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  rows={5}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  placeholder="Describe the product features, materials, and benefits…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  addImageFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                  dragActive ? "border-primary bg-accent" : "border-border bg-muted/30",
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-card ring-1 ring-border">
                  <UploadCloud className="size-5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Drag &amp; drop product images here
                  </p>
                  <p className="mt-1 text-xs text-subtle">PNG, JPG or WebP up to 10MB each</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => addImageFiles(e.target.files)}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset */}
                      <img src={img.url} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        aria-label="Remove image"
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Add image"
                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-subtle hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants & Attributes */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                Variants &amp; Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  Available Variants
                </Label>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-muted/30 p-3">
                  {variants.map((v) => (
                    <Badge key={v} variant="secondary" className="h-7 gap-1.5 rounded-full px-3 text-xs">
                      {v}
                      <button type="button" onClick={() => removeVariant(v)} aria-label={`Remove ${v}`}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={variantInput}
                    onChange={(e) => setVariantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addVariant();
                      }
                    }}
                    onBlur={addVariant}
                    placeholder="Add more…"
                    className="min-w-32 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-xs font-semibold uppercase tracking-wider text-subtle">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    className="h-11 rounded-lg bg-card"
                    placeholder="CS-PRD-00123"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="stock"
                    className="text-xs font-semibold uppercase tracking-wider text-subtle"
                  >
                    Initial Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    className="h-11 rounded-lg bg-card"
                    placeholder="100"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="base-price"
                  className="text-xs font-semibold uppercase tracking-wider text-subtle"
                >
                  Base Price
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-subtle">
                    €
                  </span>
                  <Input
                    id="base-price"
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-11 rounded-lg bg-card pl-8"
                    placeholder="0.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="discount"
                  className="text-xs font-semibold uppercase tracking-wider text-subtle"
                >
                  Discount (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  max={100}
                  className="h-11 rounded-lg bg-card"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Net Price:</span>
                  <span className="font-medium text-foreground">€{netPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tax (22%):</span>
                  <span className="font-medium text-foreground">€{tax.toFixed(2)}</span>
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>Total:</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {visibilityOptions.map((opt) => {
                const Icon = opt.icon;
                const active = visibility === opt.value;
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                      <span className="block text-xs text-subtle">{opt.description}</span>
                    </span>
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={active}
                      onChange={() => setVisibility(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                        active ? "border-primary" : "border-input",
                      )}
                    >
                      {active && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                  </label>
                );
              })}

              {visibility === "scheduled" && (
                <div className="space-y-2 px-2.5 pb-1 pt-2">
                  <Label
                    htmlFor="scheduled-date"
                    className="text-xs font-semibold uppercase tracking-wider text-subtle"
                  >
                    Publish Date
                  </Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    className="h-11 rounded-lg bg-card"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta Tags */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="size-4 text-primary" />
                Meta Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="h-6 gap-1.5 rounded-full px-2.5 text-[0.7rem] font-semibold tracking-wide"
                    >
                      {t}
                      <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder="Add tag…"
                className="h-10 rounded-lg bg-card"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
