import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Static upload dropzone — visual only. No file picker or upload wiring;
 * that lands with the backend integration phase.
 */
export function UploadField({
  label,
  hint,
  shape = "square",
  wrapperClassName,
}: {
  label: string;
  hint: string;
  shape?: "square" | "banner";
  wrapperClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 text-center transition-colors hover:bg-muted/50",
          shape === "square" ? "aspect-square w-28 py-4" : "w-full py-8",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <ImagePlus className="size-4 text-primary" />
        </span>
        <Button type="button" variant="outline" size="sm">
          Browse Files
        </Button>
      </div>
      <p className="text-xs text-subtle">{hint}</p>
    </div>
  );
}
