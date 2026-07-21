"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/**
 * Profile avatar with an upload/remove menu behind the camera button.
 * Frontend-only — the chosen file is previewed locally, never uploaded.
 */
export function ProfilePhoto({ initials }: { initials: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    // Release the previous preview so the blob doesn't leak.
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function handleRemove() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    // Clear the input so re-picking the same file still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="relative">
      <Avatar className="size-32">
        {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
        <AvatarFallback className="bg-primary font-display text-4xl font-semibold text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Change profile photo"
            className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-card outline-none transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Camera className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-48">
          <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
            <Upload />
            {photoUrl ? "Replace photo" : "Upload photo"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!photoUrl} onSelect={handleRemove}>
            <Trash2 />
            Remove photo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}
