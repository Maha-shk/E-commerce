"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadsApi } from "@/lib/api/services/admin";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Image field that uploads a file, with a URL box as the escape hatch.
 *
 * Banners could previously only be set by pasting a URL you had already hosted
 * somewhere else — there was no way to upload artwork from the admin at all.
 * The URL box is kept because an existing CDN link is still a legitimate way to
 * point at an image; uploading just no longer requires one.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  folder = "banners",
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: "banners" | "products" | "categories";
  required?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlBox, setShowUrlBox] = useState(false);

  const upload = async (file: File) => {
    // Checked here for a fast, specific message; the server re-validates.
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, WebP or AVIF image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadsApi.image(file, folder);
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${label}-upload`}>
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        <button
          type="button"
          onClick={() => setShowUrlBox((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Link2 className="size-3.5" aria-hidden />
          {showUrlBox ? "Hide URL" : "Use a URL"}
        </button>
      </div>

      {/* Drop zone / preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (isUploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed transition-colors",
          isDragging ? "border-primary bg-accent" : "border-border bg-muted/40",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
                remote host; next/image would need each one allow-listed. */}
            <img
              src={value}
              alt=""
              className="h-40 w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0";
              }}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-linear-to-t from-black/70 to-transparent p-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isUploading}
                onClick={() => onChange("")}
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            id={`${label}-upload`}
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImagePlus className="size-7" aria-hidden />
            <span className="font-medium">
              {isDragging ? "Drop to upload" : "Click to upload, or drag an image here"}
            </span>
            <span className="text-xs">JPEG, PNG, WebP or AVIF · up to 5MB</span>
          </button>
        )}

        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/75 text-sm">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            Uploading…
          </div>
        ) : null}
      </div>

      {showUrlBox ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…/image.jpg"
          aria-label={`${label} URL`}
        />
      ) : null}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so re-picking the same file still fires onChange.
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
