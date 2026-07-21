import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Table sort control. UI only for now — sorting is wired up in a later phase.
 * `size` adapts the button to sit alongside a table's existing toolbar controls.
 */
export function SortButton({
  size = "icon-lg",
  className,
}: {
  size?: "icon-sm" | "icon" | "icon-lg";
  className?: string;
}) {
  return (
    <Button variant="outline" size={size} aria-label="Sort" className={className}>
      <ArrowUpDown className="size-4" />
    </Button>
  );
}
