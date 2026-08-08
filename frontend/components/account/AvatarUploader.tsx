"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/components/account/AccountSidebar";
import { useRemoveAvatar, useUploadAvatar } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

/** Kept in step with the server's own limits, which are authoritative. */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();

  // Shows the picked file immediately instead of waiting for the round trip
  // and the CDN to serve the new URL.
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!preview) return;
    // Object URLs leak until revoked. Doing it ONLY here (rather than inside a
    // setState updater) keeps the updater pure — React may call updaters twice
    // under StrictMode, which would otherwise revoke a URL still in use.
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const isBusy = upload.isPending || remove.isPending;

  const handleFile = (file: File) => {
    // Validated here purely for a fast, specific message; the server re-checks.
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Choose a JPEG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller");
      return;
    }

    setPreview(URL.createObjectURL(file));
    upload.mutate(file, { onSettled: () => setPreview(null) });
  };

  const openPicker = () => {
    if (!isBusy) inputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isBusy) return;

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const shown = preview ?? avatarUrl;

  return (
    <div
      className="flex flex-col items-center gap-5 sm:flex-row"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isBusy) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        // Only clear when the pointer actually leaves the drop zone, not when
        // it crosses onto a child element.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
      }}
      onDrop={onDrop}
    >
      {/*
       * The photo itself is the primary control — clicking your avatar to
       * change it is the convention everywhere, and it was previously inert.
       */}
      <button
        type="button"
        onClick={openPicker}
        disabled={isBusy}
        aria-label={avatarUrl ? "Change profile picture" : "Upload a profile picture"}
        className={cn(
          "group relative shrink-0 rounded-full transition",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          isDragging && "ring-2 ring-primary ring-offset-4 ring-offset-background",
          isBusy && "cursor-not-allowed",
        )}
      >
        <Avatar className="size-24">
          {shown ? <AvatarImage src={shown} alt="" /> : null}
          <AvatarFallback className="bg-muted text-2xl font-semibold text-primary">
            {initialsOf(fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Hover/focus affordance */}
        {!isBusy ? (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white",
              "opacity-0 transition-opacity duration-150",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
              isDragging && "opacity-100",
            )}
            aria-hidden
          >
            {isDragging ? (
              <Upload className="size-6" />
            ) : (
              <Camera className="size-6" />
            )}
          </span>
        ) : null}

        {isBusy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
          </span>
        ) : null}
      </button>

      <div className="min-w-0 space-y-2 text-center sm:text-left">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={openPicker}
          >
            <Camera className="size-4" aria-hidden />
            {avatarUrl ? "Change photo" : "Upload photo"}
          </Button>

          {avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => remove.mutate()}
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          {isDragging
            ? "Drop to upload"
            : "Drag an image here, or click your photo. JPEG, PNG or WebP, up to 5MB."}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset first so re-picking the same file still fires onChange.
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
