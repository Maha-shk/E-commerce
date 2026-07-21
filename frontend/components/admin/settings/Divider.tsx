import { cn } from "@/lib/utils";

/** Thin horizontal rule used to separate groups of fields within a section. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
