import { cn } from "@/lib/utils";

export type StatusTone = "success" | "info" | "warning" | "error" | "online" | "offline" | "neutral";

const toneClass: Record<StatusTone, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  error: "bg-destructive",
  online: "bg-green",
  offline: "bg-subtle",
  neutral: "bg-muted-foreground",
};

/** Small colour-coded status dot used for presence and notification tones. */
export function StatusDot({
  tone,
  className,
  ring = false,
}: {
  tone: StatusTone;
  className?: string;
  /** Adds a card-coloured ring so the dot reads on top of an avatar. */
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        toneClass[tone],
        ring && "ring-2 ring-card",
        className,
      )}
    />
  );
}
