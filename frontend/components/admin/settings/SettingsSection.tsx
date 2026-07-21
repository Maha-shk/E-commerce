import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Standard card wrapper for a settings section: icon, title, description,
 * and a content area. `id` matches the anchor used by SettingsNav.
 */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24 gap-0 overflow-hidden py-0">
      <div className="flex items-start gap-3 border-b p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-6 p-6">{children}</div>
    </Card>
  );
}
